/**
 * SynergyAI Utility Functions Library
 *
 * Provides common formatting, data transformation, validation and helper functions
 */

// Date and time formatting
export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '';

  const d = new Date(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// Relative time (e.g. "3 hours ago")
export const getRelativeTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  if (isNaN(past.getTime())) return '';

  const diffInSeconds = Math.floor((now - past) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;

  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// Number formatting
export const formatNumber = (number, options = {}) => {
  if (number === null || number === undefined) return '';

  const {
    decimals = 2,
    decimalSeparator = '.',
    thousandSeparator = ',',
  } = options;

  try {
    const num = Number(number);
    if (isNaN(num)) return '0';

    const fixed = num.toFixed(decimals);
    const [intPart, decPart] = fixed.split('.');

    // Add thousand separators
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator);

    return decPart
      ? `${formattedInt}${decimalSeparator}${decPart}`
      : formattedInt;
  } catch (error) {
    console.error('formatNumber error:', error);
    return '0';
  }
};

// Currency formatting
export const formatCurrency = (amount, currency = 'SYN', options = {}) => {
  if (amount === null || amount === undefined) return '';

  const {
    decimals = 2,
    symbolPosition = 'before',
  } = options;

  const formattedAmount = formatNumber(amount, { decimals });
  return symbolPosition === 'before'
    ? `${currency} ${formattedAmount}`
    : `${formattedAmount} ${currency}`;
};

// File size formatting
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
};

// Address truncation (for blockchain addresses)
export const truncateAddress = (address, startChars = 6, endChars = 4) => {
  if (!address) return '';
  if (address.length <= startChars + endChars) return address;

  return `${address.substring(0, startChars)}...${address.substring(address.length - endChars)}`;
};

// Debounce function
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
};

// Deep clone object
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;

  try {
    return JSON.parse(JSON.stringify(obj));
  } catch (error) {
    console.error('deepClone error:', error);
    return obj;
  }
};

// Generate random ID
export const generateId = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Get query parameters
export const getQueryParams = (url) => {
  const params = {};
  const queryString = url ? url.split('?')[1] : window.location.search.slice(1);

  if (!queryString) return params;

  queryString.split('&').forEach(item => {
    const [key, value] = item.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });

  return params;
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};

// Validate URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Get file extension
export const getFileExtension = (filename) => {
  if (!filename) return '';
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

// Check if device is mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator?.userAgent || ''
  );
};

// Wait for specified time
export const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Group array elements
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key];
    (result[groupKey] = result[groupKey] || []).push(item);
    return result;
  }, {});
};

// Export all utility functions
export default {
  formatDate,
  getRelativeTime,
  formatNumber,
  formatCurrency,
  formatFileSize,
  truncateAddress,
  debounce,
  throttle,
  deepClone,
  generateId,
  getQueryParams,
  isValidEmail,
  isValidUrl,
  getFileExtension,
  isMobile,
  sleep,
  groupBy
};
