const lancedb = require('@lancedb/lancedb');
const OpenAI = require('openai');
const path = require('path');
const faqs = require('./data/faqs.json');

const LANCEDB_PATH = path.join(__dirname, 'lancedb_data');
const TABLE_NAME = 'faqs';
const EMBEDDING_MODEL = 'text-embedding-3-small';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

let table;

async function generateEmbedding(text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

async function initializeDB() {
  const db = await lancedb.connect(LANCEDB_PATH);

  console.log(`Generating embeddings for ${faqs.length} FAQs...`);

  const records = await Promise.all(
    faqs.map(async (faq) => {
      const text = `${faq.question} ${faq.answer}`;
      const vector = await generateEmbedding(text);
      return {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        vector,
      };
    })
  );

  // Always overwrite on startup — needed for ephemeral deployments (e.g. AWS EB)
  table = await db.createTable(TABLE_NAME, records, { mode: 'overwrite' });
  console.log(`LanceDB table "${TABLE_NAME}" created with ${records.length} entries.`);
}

async function searchFAQs(query, topK = 3) {
  if (!table) {
    throw new Error('Database not initialized. Call initializeDB() first.');
  }

  const queryVector = await generateEmbedding(query);

  const results = await table
    .vectorSearch(queryVector)
    .limit(topK)
    .toArray();

  return results.map((row) => ({
    id: row.id,
    question: row.question,
    answer: row.answer,
    category: row.category,
    score: row._distance,
  }));
}

module.exports = { initializeDB, searchFAQs };
