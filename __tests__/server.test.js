jest.mock('../embeddings', () => ({
  initializeDB: jest.fn().mockResolvedValue(undefined),
  searchFAQs: jest.fn().mockResolvedValue([
    {
      id: 1,
      question: 'What is your return policy?',
      answer: 'You can return any item within 30 days of purchase for a full refund.',
      category: 'returns',
      score: 0.1,
    },
  ]),
}));

jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'You can return items within 30 days.' } }],
        }),
      },
    },
  }));
});

const request = require('supertest');
const app = require('../server');

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('POST /api/chat', () => {
  it('returns 400 when message field is missing', async () => {
    const res = await request(app).post('/api/chat').send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when message is an empty string', async () => {
    const res = await request(app).post('/api/chat').send({ message: '   ' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 200 with a response field when message is valid', async () => {
    const res = await request(app)
      .post('/api/chat')
      .send({ message: 'What is your return policy?' });
    expect(res.statusCode).toBe(200);
    expect(res.body.response).toBeDefined();
    expect(typeof res.body.response).toBe('string');
  });
});
