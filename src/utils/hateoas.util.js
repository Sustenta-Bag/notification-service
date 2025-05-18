// src/utils/hateoas.util.js
/**
 * Utility for creating HATEOAS links
 */
export default class HateoasGenerator {
  /**
   * Generate HATEOAS links with base URL prefix
   * @param {Array} links - Array of link objects
   * @param {String} baseUrl - Base URL to prepend to all links (e.g., "/api")
   * @returns {Array} - Array of formatted link objects
   */
  static generateLinks(links, baseUrl = '/api') {
    return links.map(link => ({
      ...link,
      href: this.formatUrl(link.href, baseUrl)
    }));
  }

  /**
   * Format URL by prepending base URL if not already present
   * @param {String} url - The URL to format
   * @param {String} baseUrl - Base URL to prepend
   * @returns {String} - Formatted URL
   */
  static formatUrl(url, baseUrl) {
    // If the URL already starts with the base URL, return as is
    if (url.startsWith(baseUrl)) {
      return url;
    }
    
    // Make sure we don't double up on slashes
    const formattedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const formattedUrl = url.startsWith('/') ? url : `/${url}`;
    
    return `${formattedBaseUrl}${formattedUrl}`;
  }
}
