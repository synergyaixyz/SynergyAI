/**
 * SynergyAI Application Constants
 *
 * Stores all constants and configurations used in the application
 */

// Application information
export const APP_INFO = {
  NAME: 'SynergyAI',
  VERSION: '1.0.0',
  DESCRIPTION: 'Platform providing enterprise-grade federated learning and privacy computing solutions',
  COMPANY: 'SynergyAI Inc.',
  WEBSITE: 'https://synergyai.example.com',
  SUPPORT_EMAIL: 'support@synergyai.example.com',
  COPYRIGHT: `© ${new Date().getFullYear()} SynergyAI Inc. All rights reserved`,
};

// API configuration
export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.synergyai.example.com',
  VERSION: 'v1',
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Route paths
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT_DETAIL: (id) => `/projects/${id}`,
  FEDERATED_LEARNING: '/federated-learning',
  ZKP_VERIFICATION: '/zkp-verification',
  PRIVACY_COMPUTING: '/privacy-computing',
  SETTINGS: '/settings',
  PROFILE: '/profile',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
  },
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'synergy_auth_token',
  USER_INFO: 'synergy_user_info',
  THEME_PREFERENCE: 'synergy_theme',
  LANGUAGE_PREFERENCE: 'synergy_language',
  LAST_VISITED: 'synergy_last_visited',
};

// Supported languages
export const LANGUAGES = {
  ZH_CN: {
    code: 'zh-CN',
    name: 'Chinese (Simplified)',
    flag: '🇨🇳',
  },
  EN_US: {
    code: 'en-US',
    name: 'English',
    flag: '🇺🇸',
  },
};

// Theme options
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
};

// File upload configuration
export const UPLOAD = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ACCEPTED_FILE_TYPES: [
    'application/json',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
  ],
  IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
};

// Pagination default settings
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
  DEFAULT_PAGE: 1,
};

// Default date formats
export const DATE_FORMATS = {
  SHORT_DATE: 'YYYY-MM-DD',
  LONG_DATE: 'YYYY/MM/DD',
  TIME: 'HH:mm:ss',
  DATE_TIME: 'YYYY-MM-DD HH:mm:ss',
  CALENDAR: 'YYYY/MM/DD HH:mm',
  RELATIVE: 'relative',
};

// HTTP status codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Federated learning model types
export const MODEL_TYPES = {
  LINEAR_REGRESSION: 'linear_regression',
  LOGISTIC_REGRESSION: 'logistic_regression',
  NEURAL_NETWORK: 'neural_network',
  RANDOM_FOREST: 'random_forest',
  GRADIENT_BOOSTING: 'gradient_boosting',
  SVM: 'support_vector_machine',
  CUSTOM: 'custom',
};

// Data permission types
export const PERMISSION_TYPES = {
  READ: 'read',
  WRITE: 'write',
  EXECUTE: 'execute',
  ADMIN: 'admin',
};

// Project status
export const PROJECT_STATUS = {
  DRAFT: {
    value: 'draft',
    label: 'Draft',
    color: 'default',
  },
  PENDING: {
    value: 'pending',
    label: 'Pending Review',
    color: 'processing',
  },
  ACTIVE: {
    value: 'active',
    label: 'Active',
    color: 'success',
  },
  PAUSED: {
    value: 'paused',
    label: 'Paused',
    color: 'warning',
  },
  COMPLETED: {
    value: 'completed',
    label: 'Completed',
    color: 'success',
  },
  CANCELLED: {
    value: 'cancelled',
    label: 'Cancelled',
    color: 'error',
  },
};

// Task priority
export const TASK_PRIORITY = {
  LOW: {
    value: 'low',
    label: 'Low',
    color: 'blue',
  },
  MEDIUM: {
    value: 'medium',
    label: 'Medium',
    color: 'green',
  },
  HIGH: {
    value: 'high',
    label: 'High',
    color: 'orange',
  },
  URGENT: {
    value: 'urgent',
    label: 'Urgent',
    color: 'red',
  },
};

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An error occurred during the operation. Please try again later',
  NETWORK: 'Network error. Please check your internet connection',
  UNAUTHORIZED: 'Your login has expired or is invalid. Please log in again',
  PERMISSION: 'You do not have permission to perform this action',
  NOT_FOUND: 'The requested resource does not exist',
  VALIDATION: 'Please check if the input data is correct',
  SERVER: 'Server error. Please contact technical support',
};

// Export all constants
export default {
  APP_INFO,
  API,
  ROUTES,
  STORAGE_KEYS,
  LANGUAGES,
  THEMES,
  UPLOAD,
  PAGINATION,
  DATE_FORMATS,
  HTTP_STATUS,
  MODEL_TYPES,
  PERMISSION_TYPES,
  PROJECT_STATUS,
  TASK_PRIORITY,
  ERROR_MESSAGES,
};
