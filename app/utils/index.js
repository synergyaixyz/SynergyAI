/**
 * SynergyAI Utility Library Export
 *
 * This file centralizes the export of all utility functions, constants, and services
 * for easy import and use in the application
 */

// Import utility modules
import helpers from './helpers';
import constants from './constants';
import storage from './storage';
import ApiService, { apiClient } from './api';

// Export all constants and configurations
export * from './constants';

// Export all formatting and helper functions
export * from './helpers';

// Export all storage-related functionality
export * from './storage';

// Export API service
export { ApiService, apiClient };

// Default export of all utilities collection
export default {
  ...helpers,
  ...constants,
  storage,
  api: ApiService,
  apiClient,
};
