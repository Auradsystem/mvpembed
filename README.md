# PDF Document Search System with OpenAI Embeddings

This application allows you to upload PDF documents, extract their text, generate embeddings using OpenAI's API, and perform semantic searches across the documents.

## Features

- PDF text extraction using Node.js
- Semantic search using OpenAI embeddings
- Vector similarity search for finding relevant document sections
- Code highlighting for code snippets in documents
- Simple and intuitive user interface

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=3000
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. In a separate terminal, start the backend server:
   ```
   npm run server
   ```

## Usage

1. Upload PDF documents using the file upload section
2. Enter search queries in the search box
3. View search results with highlighted code snippets (if present)

## Technical Details

- Frontend: TypeScript with Vite
- Backend: Node.js with Express
- PDF Processing: pdf-parse
- Vector Storage: hnswlib-node
- Embeddings: OpenAI API (text-embedding-ada-002)
- Code Highlighting: highlight.js

## Project Structure

- `/server`: Backend code for PDF processing and search
- `/src`: Frontend code for the user interface
- `/server/uploads`: Directory where uploaded PDFs are stored

## License

MIT
