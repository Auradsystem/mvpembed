import hljs from 'highlight.js';

export const highlighter = {
  /**
   * Highlight code blocks in text
   * @param {string} text - Text that may contain code blocks
   * @returns {string} - Text with highlighted code blocks
   */
  highlightCode(text) {
    // Simple regex to detect code blocks
    // This is a basic implementation - in a real app, you might want more sophisticated detection
    const codeBlockRegex = /```([a-zA-Z]*)\n([\s\S]*?)\n```/g;
    
    // Replace code blocks with highlighted versions
    const highlightedText = text.replace(codeBlockRegex, (match, language, code) => {
      try {
        // If language is specified and supported by highlight.js
        if (language && hljs.getLanguage(language)) {
          const highlighted = hljs.highlight(code, { language });
          return `<pre><code class="hljs language-${language}">${highlighted.value}</code></pre>`;
        } else {
          // Auto-detect language
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
