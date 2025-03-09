import { uploadFile, searchDocuments, getDocuments } from './api';

export function setupApp() {
  const appElement = document.querySelector<HTMLDivElement>('#app');
  
  if (!appElement) {
    console.error('App element not found');
    return;
  }
  
  // Create app structure
  appElement.innerHTML = `
    <div class="container">
      <h1>PDF Document Search System</h1>
      
      <div class="upload-section">
        <h2>Upload Documents</h2>
        <div class="file-upload">
          <div class="file-input-container">
            <input type="file" id="file-input" accept=".pdf" multiple />
            <button id="upload-button" class="primary">Upload</button>
          </div>
          <div id="upload-status"></div>
        </div>
        <div class="file-list">
          <h3>Uploaded Documents</h3>
          <div id="document-list">Loading documents...</div>
        </div>
      </div>
      
      <div class="search-section">
        <h2>Search Documents</h2>
        <div class="search-form">
          <input type="text" id="search-input" class="search-input" placeholder="Enter your search query..." />
          <button id="search-button" class="primary">Search</button>
        </div>
        <div id="search-status"></div>
      </div>
      
      <div class="results-section">
        <h2>Search Results</h2>
        <div id="search-results"></div>
      </div>
    </div>
  `;
  
  // Get DOM elements
  const fileInput = document.getElementById('file-input') as HTMLInputElement;
  const uploadButton = document.getElementById('upload-button') as HTMLButtonElement;
  const uploadStatus = document.getElementById('upload-status') as HTMLDivElement;
  const documentList = document.getElementById('document-list') as HTMLDivElement;
  const searchInput = document.getElementById('search-input') as HTMLInputElement;
  const searchButton = document.getElementById('search-button') as HTMLButtonElement;
  const searchStatus = document.getElementById('search-status') as HTMLDivElement;
  const searchResults = document.getElementById('search-results') as HTMLDivElement;
  
  // Load documents
  loadDocuments();
  
  // Event listeners
  uploadButton.addEventListener('click', async () => {
    if (!fileInput.files || fileInput.files.length === 0) {
      showStatus(uploadStatus, 'Please select at least one PDF file', 'error');
      return;
    }
    
    // Upload each file
    for (let i = 0; i < fileInput.files.length; i++) {
      const file = fileInput.files[i];
      
      // Show loading status
      showStatus(uploadStatus, `Uploading ${file.name}...`, 'loading');
      
      try {
        await uploadFile(file);
        showStatus(uploadStatus, `${file.name} uploaded successfully`, 'success');
        
        // Reload document list
        loadDocuments();
      } catch (error: any) {
        showStatus(uploadStatus, `Error uploading ${file.name}: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  });
  
  searchButton.addEventListener('click', async () => {
    const query = searchInput.value.trim();
    
    if (!query) {
      showStatus(searchStatus, 'Please enter a search query', 'error');
      return;
    }
    
    // Show loading status
    showStatus(searchStatus, 'Searching...', 'loading');
    searchResults.innerHTML = '';
    
    try {
      const results = await searchDocuments(query);
      
      // Hide loading status
      searchStatus.innerHTML = '';
      
      if (results.length === 0) {
        searchResults.innerHTML = '<div class="status-message">No results found</div>';
        return;
      }
      
      // Display results
      searchResults.innerHTML = results.map((result: any) => `
        <div class="result-item">
          <div class="result-header">
            <div class="result-document">${result.metadata.fileName}</div>
            <div class="result-score">Score: ${(1 - result.score).toFixed(2)}</div>
          </div>
          <div class="result-content">${result.metadata.highlightedText || result.metadata.text}</div>
        </div>
      `).join('');
    } catch (error: any) {
      showStatus(searchStatus, `Error searching: ${error.message || 'Unknown error'}`, 'error');
    }
  });
  
  // Allow pressing Enter to search
  searchInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      searchButton.click();
    }
  });
  
  // Function to load documents
  async function loadDocuments() {
    try {
      documentList.innerHTML = 'Loading documents...';
      
      const documents = await getDocuments();
      
      if (documents.length === 0) {
        documentList.innerHTML = '<div class="status-message">No documents uploaded yet</div>';
        return;
      }
      
      documentList.innerHTML = documents.map((document: string) => `
        <div class="file-item">
          <div>${document}</div>
        </div>
      `).join('');
    } catch (error: any) {
      documentList.innerHTML = `<div class="status-message error">Error loading documents: ${error.message || 'Unknown error'}</div>`;
    }
  }
  
  // Function to show status messages
  function showStatus(element: HTMLElement, message: string, type: 'success' | 'error' | 'loading') {
    if (type === 'loading') {
      element.innerHTML = `${message} <span class="loading"></span>`;
      element.className = 'status-message';
    } else {
      element.innerHTML = message;
      element.className = `status-message ${type}`;
    }
  }
}
