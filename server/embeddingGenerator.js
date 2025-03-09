import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const embeddingGenerator = {
  /**
   * Generate embedding for a text using OpenAI API
   * @param {string} text - Text to generate embedding for
   * @returns {Promise<number[]>} - Embedding vector
   */
  async generateEmbedding(text) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding: ' + (error.message || 'Unknown error'));
    }
  },

  /**
   * Batch generate embeddings for multiple texts
   * @param {string[]} texts - Array of texts to generate embeddings for
   * @returns {Promise<number[][]>} - Array of embedding vectors
   */
  async batchGenerateEmbeddings(texts) {
    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: texts
      });
      
      return response.data.map(item => item.embedding);
    } catch (error) {
      console.error('Error batch generating embeddings:', error);
      throw new Error('Failed to batch generate embeddings: ' + (error.message || 'Unknown error'));
    }
  }
};
