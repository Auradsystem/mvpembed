import pdfParse from 'pdf-parse';
import fs from 'fs';

export const pdfExtractor = {
  /**
   * Extract text from a PDF file
   * @param {string} filePath - Path to the PDF file
   * @returns {Promise<string>} - Extracted text
   */
  async extractText(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return data.text;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error('Failed to extract text from PDF');
    }
  },

  /**
   * Split text into chunks of approximately the specified size
   * @param {string} text - Text to split
   * @param {number} chunkSize - Approximate size of each chunk in characters
   * @returns {string[]} - Array of text chunks
   */
  splitIntoChunks(text, chunkSize = 1000) {
    // Clean the text by removing excessive whitespace
    const cleanedText = text.replace(/\s+/g, ' ').trim();
    
    // Split by paragraphs first
    const paragraphs = cleanedText.split(/\n\s*\n/);
    
    const chunks = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      // If adding this paragraph would exceed the chunk size, save the current chunk and start a new one
      if (currentChunk.length + paragraph.length > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      
      // If the paragraph itself is larger than the chunk size, split it further
      if (paragraph.length > chunkSize) {
        // Split by sentences
        const sentences = paragraph.split(/(?<=[.!?])\s+/);
        
        for (const sentence of sentences) {
          if (currentChunk.length + sentence.length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            currentChunk = '';
          }
          
          // If the sentence itself is too large, split it by words
          if (sentence.length > chunkSize) {
            const words = sentence.split(/\s+/);
            for (const word of words) {
              if (currentChunk.length + word.length + 1 > chunkSize && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
              }
              currentChunk += (currentChunk ? ' ' : '') + word;
            }
          } else {
            currentChunk += (currentChunk ? ' ' : '') + sentence;
          }
        }
      } else {
        currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
      }
    }
    
    // Add the last chunk if it's not empty
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
};
