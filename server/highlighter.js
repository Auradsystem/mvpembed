import hljs from 'highlight.js';

export const highlighter = {
  /**
   * Highlight code blocks in text
   * @param {string} text - Text that may contain code blocks
   * @returns {string} - Text with highlighted code blocks
   */
  highlightCode(text) {
    if (!text) return '';
    
    // Simple detection of code blocks (text that looks like code)
    // This is a basic implementation - could be improved with more sophisticated detection
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)\n```/g;
    
    // Replace code blocks with highlighted versions
    const highlightedText = text.replace(codeBlockRegex, (match, language, code) => {
      try {
        // If language is specified and supported by highlight.js
        if (language && hljs.getLanguage(language)) {
          const highlighted = hljs.highlight(code, { language });
          return `<pre><code class="hljs language-${language}">${highlighted.value}</code></pre>`;
        } 
        // Auto-detect language
        else {
          const highlighted = hljs.highlightAuto(code);
          return `<pre><code class="hljs">${highlighted.value}</code></pre>`;
        }
      } catch (error) {
        console.error('Error highlighting code:', error);
        // Return original code block if highlighting fails
        return `<pre><code>${code}</code></pre>`;
      }
    });
    
    return highlightedText;
  }
};
