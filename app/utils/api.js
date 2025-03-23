/**
 * SynergyAI API Service
 *
 * Provides methods and interceptors for communication with backend API
 */

import axios from 'axios';
import { API, STORAGE_KEYS, HTTP_STATUS } from './constants';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API.BASE_URL}/${API.VERSION}`,
  timeout: API.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from local storage
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);

    // Add token to request headers if it exists
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized error (token expiration)
    if (
      error.response &&
      error.response.status === HTTP_STATUS.UNAUTHORIZED &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Token refresh logic can be implemented here
        // const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        // const response = await axios.post(`${API.BASE_URL}/auth/refresh`, { refreshToken });
        // const { token } = response.data;
        // localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

        // Retry original request with new token
        // originalRequest.headers.Authorization = `Bearer ${token}`;
        // return apiClient(originalRequest);

        // Temporary: Redirect to login
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        window.location.href = '/auth/login';
        return Promise.reject(error);
      } catch (refreshError) {
        // Token refresh failed, redirect to login page
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_INFO);
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// API Service class
class ApiService {
  /**
   * Send GET request
   * @param {string} url - Request URL
   * @param {Object} params - URL parameters
   * @param {Object} config - Other configuration options
   * @returns {Promise} - Response data
   */
  static async get(url, params = {}, config = {}) {
    try {
      return await apiClient.get(url, { ...config, params });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send POST request
   * @param {string} url - Request URL
   * @param {Object} data - Request body data
   * @param {Object} config - Other configuration options
   * @returns {Promise} - Response data
   */
  static async post(url, data = {}, config = {}) {
    try {
      return await apiClient.post(url, data, config);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send PUT request
   * @param {string} url - Request URL
   * @param {Object} data - Request body data
   * @param {Object} config - Other configuration options
   * @returns {Promise} - Response data
   */
  static async put(url, data = {}, config = {}) {
    try {
      return await apiClient.put(url, data, config);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send PATCH request
   * @param {string} url - Request URL
   * @param {Object} data - Request body data
   * @param {Object} config - Other configuration options
   * @returns {Promise} - Response data
   */
  static async patch(url, data = {}, config = {}) {
    try {
      return await apiClient.patch(url, data, config);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send DELETE request
   * @param {string} url - Request URL
   * @param {Object} config - Other configuration options
   * @returns {Promise} - Response data
   */
  static async delete(url, config = {}) {
    try {
      return await apiClient.delete(url, config);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Upload file
   * @param {string} url - Request URL
   * @param {FormData} formData - FormData containing files
   * @param {Function} onProgress - Progress callback function
   * @param {Object} config - Other configuration options
   * @returns {Promise} - Response data
   */
  static async uploadFile(url, formData, onProgress = null, config = {}) {
    try {
      return await apiClient.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress
          ? (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          : undefined,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Download file
   * @param {string} url - Request URL
   * @param {Object} params - URL parameters
   * @param {Function} onProgress - Progress callback function
   * @param {Object} config - Other configuration options
   * @returns {Promise} - Response data
   */
  static async downloadFile(url, params = {}, onProgress = null, config = {}) {
    try {
      return await apiClient.get(url, {
        ...config,
        params,
        responseType: 'blob',
        onDownloadProgress: onProgress
          ? (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              onProgress(percentCompleted);
            }
          : undefined,
      });
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handling
   * @param {Error} error - Error object
   * @returns {Promise} - Rejected Promise
   */
  static handleError(error) {
    // Global error handling logic can be added here
    // Such as displaying error notifications, logging errors, etc.

    // Extract error message
    let errorMessage = error.message || 'Unknown error';
    if (error.response) {
      // Server responded with an error status code
      const { status, data } = error.response;
      errorMessage = data.message || `Server error: ${status}`;
    } else if (error.request) {
      // Request was sent but no response received
      errorMessage = 'No response from server, please try again later';
    }

    // Console log error details
    console.error('API request error:', {
      message: errorMessage,
      error: error,
    });

    return Promise.reject({
      message: errorMessage,
      originalError: error,
    });
  }
}

// Export API service instance
export default ApiService;

// Export configured axios instance for direct use when needed
export { apiClient };
