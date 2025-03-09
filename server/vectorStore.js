import hnsw from 'hnswlib-node';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const indexPath = path.join(__dirname, 'vector_index.bin');
const itemsPath = path.join(__dirname, 'items.json');
const documentsPath = path.join(__dirname, 'documents.json');

export const vectorStore = {
  index: null,
  items: new Map(),
  documents: new Set(),
  
  /**
   * Initialize the vector store
   */
  initialize() {
    try {
      // Try to load existing index first
      if (this.loadIndex()) {
        console.log('Loaded existing vector store from disk');
        return;
      }
      
      // Create a new index if loading failed
      this.index = new hnsw.HierarchicalNSW('cosine', 1536); // 1536 is the dimension of OpenAI embeddings
      this.index.initIndex(10000); // Max number of elements
      
      console.log('Vector store initialized with new index');
    } catch (error) {
      console.error('Error initializing vector store:', error);
      
      // Fallback to creating a new index if loading fails
      try {
        this.index = new hnsw.HierarchicalNSW('cosine', 1536);
        this.index.initIndex(10000);
        this.items = new Map();
        this.documents = new Set();
        console.log('Vector store initialized with fallback new index');
      } catch (fallbackError) {
        console.error('Critical error initializing vector store:', fallbackError);
        throw new Error('Failed to initialize vector store');
      }
    }
  },
  
  /**
   * Add an item to the vector store
   * @param {string} id - Unique identifier for the item
   * @param {number[]} embedding - Embedding vector
   * @param {Object} metadata - Additional metadata
   */
  addItem(id, embedding, metadata) {
    try {
      if (!this.index) {
        throw new Error('Vector store not initialized');
      }
      
      const currentCount = this.index.getCurrentCount();
      this.index.addPoint(embedding, currentCount);
      
      this.items.set(currentCount, {
        id,
        metadata
      });
      
      // Add document name to the set of documents
      if (metadata.fileName) {
        this.documents.add(metadata.fileName);
      }
      
      // Save after adding items
      this.saveIndex();
      
      return currentCount;
    } catch (error) {
      console.error('Error adding item to vector store:', error);
      throw new Error('Failed to add item to vector store: ' + (error.message || 'Unknown error'));
    }
  },
  
  /**
   * Search for similar items
   * @param {number[]} queryEmbedding - Query embedding vector
   * @param {number} k - Number of results to return
   * @returns {Array} - Array of similar items
   */
  search(queryEmbedding, k = 5) {
    try {
      if (!this.index) {
        throw new Error('Vector store not initialized');
      }
      
      // Ensure k is not greater than the number of items
      const itemCount = this.index.getCurrentCount();
      if (itemCount === 0) {
        return [];
      }
      
      const actualK = Math.min(k, itemCount);
      
      const result = this.index.searchKnn(queryEmbedding, actualK);
      
      return result.neighbors.map((index, i) => {
        const item = this.items.get(index);
        if (!item) {
          console.warn(`Item at index ${index} not found in items map`);
          return null;
        }
        return {
          id: item.id,
          score: result.distances[i],
          metadata: item.metadata
        };
      }).filter(item => item !== null);
    } catch (error) {
      console.error('Error searching vector store:', error);
      return [];
    }
  },
  
  /**
   * Get the list of documents in the vector store
   * @returns {string[]} - Array of document names
   */
  getDocuments() {
    return Array.from(this.documents);
  },
  
  /**
   * Save the index to disk
   */
  saveIndex() {
    try {
      if (!this.index) {
        console.warn('Cannot save index: Vector store not initialized');
        return;
      }
      
      // Create directory if it doesn't exist
      const dir = path.dirname(indexPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      this.index.writeIndex(indexPath);
      
      // Convert Map to array for JSON serialization
      const itemsArray = Array.from(this.items.entries());
      fs.writeFileSync(itemsPath, JSON.stringify(itemsArray));
      
      // Convert Set to array for JSON serialization
      const documentsArray = Array.from(this.documents);
      fs.writeFileSync(documentsPath, JSON.stringify(documentsArray));
      
      console.log('Vector store saved to disk');
    } catch (error) {
      console.error('Error saving vector store:', error);
      // Don't throw here to prevent crashing the app
    }
  },
  
  /**
   * Load the index from disk
   */
  loadIndex() {
    try {
      if (!fs.existsSync(indexPath) || !fs.existsSync(itemsPath) || !fs.existsSync(documentsPath)) {
        console.log('One or more vector store files not found, will create new index');
        return false;
      }
      
      // Create a new index
      this.index = new hnsw.HierarchicalNSW('cosine', 1536);
      
      // Read the index from disk
      this.index.readIndex(indexPath);
      
      // Read items and documents
      const itemsData = JSON.parse(fs.readFileSync(itemsPath, 'utf8'));
      this.items = new Map(itemsData);
      
      const documentsData = JSON.parse(fs.readFileSync(documentsPath, 'utf8'));
      this.documents = new Set(documentsData);
      
      console.log('Vector store loaded from disk');
      return true;
    } catch (error) {
      console.error('Error loading vector store:', error);
      return false;
    }
  }
};
