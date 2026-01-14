/**
 * Simple markdown parser for task descriptions
 * Converts basic markdown syntax to HTML
 * Supports: bold, italic, links, code, lists
 */

/**
 * Converts markdown text to HTML
 * @param {string} text - Markdown formatted text
 * @returns {string} HTML formatted text
 */
export const parseMarkdown = (text) => {
  if (!text) return ''
  
  let html = text
  
  // Escape HTML to prevent XSS
  html = escapeHtml(html)
  
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__(.+?)__/g, '<strong>$1</strong>')
  
  // Italic: *text* or _text_
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')
  html = html.replace(/_(.+?)_/g, '<em>$1</em>')
  
  // Inline code: `code`
  html = html.replace(/`(.+?)`/g, '<code>$1</code>')
  
  // Links: [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // Unordered lists: - item or * item
  html = html.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>')
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
  
  // Ordered lists: 1. item
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>')
  
  // Line breaks
  html = html.replace(/\n/g, '<br />')
  
  return html
}

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeHtml = (text) => {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  
  return text.replace(/[&<>"']/g, (m) => map[m])
}
