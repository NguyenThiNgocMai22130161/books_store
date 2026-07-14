/**
 * Admin Order Service API Client
 * Handles admin order management operations
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/admin/orders';

/**
 * Admin Order Service
 */
export const adminOrderService = {
  /**
   * Get orders with filters and pagination
   * @param {object} params - Query parameters (page, size, keyword, status, paymentMethod, fromDate, toDate, sort)
   * @returns {Promise} Paginated orders list
   */
  getOrders: async (params = {}) => {
    try {
      const response = await axios.get(API_BASE_URL, {
        params,
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  },

  /**
   * Get order detail by ID
   * @param {number} orderId - Order ID
   * @returns {Promise} Order detail
   */
  getOrderDetail: async (orderId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/${orderId}`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Get order detail error:', error);
      throw error;
    }
  },

  /**
   * Update order status
   * @param {number} orderId - Order ID
   * @param {string} status - New status
   * @returns {Promise} Updated order
   */
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/${orderId}/status`,
        { status },
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      console.error('Update order status error:', error);
      throw error;
    }
  },

  /**
   * Get order statistics for dashboard
   * @returns {Promise} Order statistics
   */
  getStatistics: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/statistics`, {
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      console.error('Get order statistics error:', error);
      throw error;
    }
  }
};

export default adminOrderService;
