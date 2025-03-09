import axios from 'axios';

const API_URL = '/api';

/**
 * Upload a PDF file to the server
 * @param file - PDF file to upload
 * @returns Promise with upload result
 */
export async function uploadFile(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('pdf', file);
  
  try {
    const response = await axios.post(`${API_URL}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error uploading file:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload file');
  }
}

/**
 * Search documents with a query
 * @param query - Search query
 * @param limit - Maximum number of results to return
 * @returns Promise with search results
 */
export async function searchDocuments(query: string, limit: number = 5): Promise<any[]> {
  try {
    const response = await axios.post(`${API_URL}/search`, {
      query,
      limit
    });
    
    return response.data.results || [];
  } catch (error: any) {
    console.error('Error searching documents:', error);
    throw new Error(error.response?.data?.error || 'Failed to search documents');
  }
}

/**
 * Get list of uploaded documents
 * @returns Promise with list of document names
 */
export async function getDocuments(): Promise<string[]> {
  try {
    const response = await axios.get(`${API_URL}/documents`);
    return response.data.documents || [];
  } catch (error: any) {
    console.error('Error fetching documents:', error);
    throw new Error(error.response?.data?.error || 'Failed to fetch documents');
  }
}
