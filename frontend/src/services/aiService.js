/**
 * AI Service API Client
 * Handles communication with Python AI Service
 */

import axios from 'axios';

// API Base URL - Direct to Python AI service
// TODO: Change to Spring Boot proxy when ready: https://books-store-backend-production.up.railway.app/api/ai
const API_BASE_URL = 'https://books-store-ai-production.up.railway.app/api';

/**
 * AI Service API
 */
export const aiService = {
  /**
   * Send chat message to AI
   * @param {string} message - User's message
   * @param {number|null} bookId - Optional book context
   * @param {string|null} category - Optional category filter
   * @param {string|null} sessionId - Optional session ID
   * @returns {Promise} Chat response with answer and sources
   */
  chat: async (message, bookId = null, category = null, sessionId = null) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message,
        book_id: bookId,
        category,
        session_id: sessionId
      });
      return response.data;
    } catch (error) {
      console.error('AI Chat error:', error);
      throw error;
    }
  },

  /**
   * Semantic search for books
   * @param {string} query - Search query
   * @param {number} topK - Number of results
   * @param {object} filters - Optional filters (category, minPrice, maxPrice)
   * @returns {Promise} Search results
   */
  search: async (query, topK = 5, filters = {}) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/search`, {
        query,
        topK,
        ...filters
      });
      return response.data;
    } catch (error) {
      console.error('AI Search error:', error);
      throw error;
    }
  },

  /**
   * Get similar books
   * @param {number} bookId - Reference book ID
   * @param {number} topK - Number of similar books
   * @returns {Promise} Similar books
   */
  getSimilarBooks: async (bookId, topK = 5) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/similar`, {
        book_id: bookId,
        top_k: topK
      });
      return response.data;
    } catch (error) {
      console.error('AI Similar books error:', error);
      throw error;
    }
  },

  /**
   * Check AI service health
   * @returns {Promise} Health status
   */
  checkHealth: async () => {
    try {
      const response = await axios.get('https://books-store-ai-production.up.railway.app/health');
      return response.data;
    } catch (error) {
      console.error('AI Health check error:', error);
      return { status: 'unavailable' };
    }
  }
};

export default aiService;
