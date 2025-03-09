import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { pdfExtractor } from './pdfExtractor.js';
import { embeddingGenerator } from './embeddingGenerator.js';
import { vectorStore } from './vectorStore.js';
import { highlighter } from './highlighter.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize vector store
try {
  vectorStore.initialize();
} catch (error) {
  console.error('Failed to initialize vector store:', error);
}

// Routes
app.post('/api/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    // Extract text from PDF
    const extractedText = await pdfExtractor.extractText(filePath);
    
    if (!extractedText || extractedText.trim() === '') {
      return res.status(400).json({ error: 'No text could be extracted from the PDF' });
    }
    
    // Split text into chunks
    const chunks = pdfExtractor.splitIntoChunks(extractedText, 1000);
    
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No text chunks could be created from the PDF' });
    }
    
    // Generate embeddings for each chunk
    const embeddingsPromises = chunks.map(async (chunk, index) => {
      try {
        const embedding = await embeddingGenerator.generateEmbedding(chunk);
        return {
          id: `${fileName}-${index}`,
          text: chunk,
          embedding,
          metadata: {
            fileName,
            chunkIndex: index
          }
        };
      } catch (error) {
        console.error(`Error generating embedding for chunk ${index}:`, error);
        return null;
      }
    });

    const embeddings = (await Promise.all(embeddingsPromises)).filter(item => item !== null);
    
    if (embeddings.length === 0) {
      return res.status(500).json({ error: 'Failed to generate embeddings for the PDF' });
    }
    
    // Add embeddings to vector store
    embeddings.forEach(item => {
      try {
        vectorStore.addItem(item.id, item.embedding, { text: item.text, ...item.metadata });
      } catch (error) {
        console.error(`Error adding item ${item.id} to vector store:`, error);
      }
    });

    res.json({
      success: true,
      fileName,
      chunksCount: embeddings.length
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: error.message || 'Error processing PDF' });
  }
});

app.post('/api/search', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Generate embedding for the query
    const queryEmbedding = await embeddingGenerator.generateEmbedding(query);
    
    // Search for similar documents
    const results = vectorStore.search(queryEmbedding, limit);
    
    if (!results || results.length === 0) {
      return res.json({
        success: true,
        results: []
      });
    }
    
    // Process results to highlight code if present
    const processedResults = results.map(result => {
      try {
        const text = result.metadata.text;
        const highlightedText = highlighter.highlightCode(text);
        
        return {
          ...result,
          metadata: {
            ...result.metadata,
            highlightedText
          }
        };
      } catch (error) {
        console.error('Error processing search result:', error);
        return result;
      }
    });

    res.json({
      success: true,
      results: processedResults
    });
  } catch (error) {
    console.error('Error searching:', error);
    res.status(500).json({ error: error.message || 'Error searching' });
  }
});

app.get('/api/documents', (req, res) => {
  try {
    const documents = vectorStore.getDocuments();
    res.json({
      success: true,
      documents
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: error.message || 'Error fetching documents' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
