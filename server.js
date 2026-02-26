require('dotenv').config();
const express = require('express');
const { initializeDB, searchFAQs } = require('./embeddings');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 8080;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(express.json());
app.use(express.static('public'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'message field is required and must be a non-empty string.' });
  }

  try {
    const relevantFAQs = await searchFAQs(message.trim(), 3);

    const context = relevantFAQs
      .map((faq, i) => `[${i + 1}] Q: ${faq.question}\nA: ${faq.answer}`)
      .join('\n\n');

    const systemPrompt = `You are a helpful customer support assistant for ShopEasy, an e-commerce company. Answer the customer's question based ONLY on the following FAQ context. If the answer is not in the context, say you don't have that information and suggest contacting support@shopeasy.com.

FAQ Context:
${context}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message.trim() },
      ],
      temperature: 0.2,
      max_tokens: 512,
    });

    const response = completion.choices[0].message.content;
    return res.json({ response });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'An error occurred while processing your request. Please try again.' });
  }
});

if (require.main === module) {
  initializeDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to initialize:', err);
      process.exit(1);
    });
}

module.exports = app;
