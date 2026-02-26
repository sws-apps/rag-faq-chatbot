# RAG FAQ Chatbot

A Node.js chatbot that answers frequently asked questions using Retrieval-Augmented Generation (RAG). It embeds your FAQ dataset into a local LanceDB vector store and uses OpenAI to generate accurate, context-grounded answers.

## Features

- Semantic search over a FAQ dataset using LanceDB vector embeddings
- OpenAI-powered answer generation with retrieved context
- Simple REST API (`POST /api/chat`)
- Static frontend served from `public/`
- Easy-to-update FAQ dataset (JSON file)
- AWS Elastic Beanstalk ready

## Prerequisites

- Node.js 18+
- An OpenAI API key

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/sws-apps/rag-faq-chatbot.git
cd rag-faq-chatbot

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Start the server
npm start
```

The server runs on `http://localhost:8080` by default.

## Environment Variables

| Variable         | Required | Default | Description                          |
|------------------|----------|---------|--------------------------------------|
| `OPENAI_API_KEY` | Yes      | —       | Your OpenAI API key                  |
| `PORT`           | No       | `8080`  | Port the Express server listens on   |

## How to Update the FAQ Dataset

1. Edit `data/faqs.json` — add, remove, or update FAQ entries in this format:
   ```json
   [
     {
       "question": "What is your return policy?",
       "answer": "We offer a 30-day return policy on all items."
     }
   ]
   ```
2. Restart the server (`npm start`). On startup, the server re-indexes all FAQs into LanceDB automatically.

## API Endpoints

### `POST /api/chat`

Send a question and receive an AI-generated answer based on the FAQ dataset.

**Request body:**
```json
{ "message": "What is your return policy?" }
```

**Response:**
```json
{ "response": "We offer a 30-day return policy on all items." }
```

### `GET /api/health`

Returns `200 OK` when the server is running.

## Project Structure

```
rag-faq-chatbot/
├── .ebextensions/
│   └── nodecommand.config   # AWS Elastic Beanstalk config
├── .github/
│   └── workflows/
│       └── ci.yml           # GitHub Actions CI
├── data/
│   └── faqs.json            # FAQ dataset
├── public/
│   └── index.html           # Chat frontend
├── .env.example             # Environment variable template
├── .gitignore
├── package.json
├── Procfile                 # Process declaration for deployment
├── README.md
└── server.js                # Express server + RAG pipeline
```

## AWS Elastic Beanstalk Deployment

### Prerequisites
- AWS CLI installed and configured
- EB CLI installed (`pip install awsebcli`)

### Steps

```bash
# 1. Initialize EB application (first time only)
eb init rag-faq-chatbot --platform "Node.js 18" --region us-east-1

# 2. Create an environment
eb create rag-faq-chatbot-prod

# 3. Set environment variables
eb setenv OPENAI_API_KEY=your_key_here NODE_ENV=production

# 4. Deploy
eb deploy

# 5. Open the app
eb open
```

### Subsequent Deploys

```bash
eb deploy
```

### Notes
- The `Procfile` tells EB to run `node server.js`
- `.ebextensions/nodecommand.config` sets `NODE_ENV=production` and the node command
- LanceDB stores data locally in `lancedb_data/` — this is ephemeral on EB; for production persistence consider using EFS or an external vector store

## License

MIT
