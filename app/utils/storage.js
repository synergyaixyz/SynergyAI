/**
 * SynergyAI Local Storage Management Tool
 *
 * Provides secure wrappers for localStorage and sessionStorage
 */

// LocalStorage Manager
export const LocalStorage = {
  /**
   * Set localStorage item
   * @param {string} key - Storage key name
   * @param {any} value - Storage value (will be JSON serialized)
   * @returns {boolean} - Whether operation was successful
   */
  set(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error('LocalStorage set failed:', error);
      return false;
    }
  },

  /**
   * Get localStorage item
   * @param {string} key - Storage key name
   * @param {any} defaultValue - Default value when value doesn't exist or parsing fails
   * @returns {any} - Storage value or default value
   */
  get(key, defaultValue = null) {
    try {
      const serializedValue = localStorage.getItem(key);
      if (serializedValue === null) return defaultValue;
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error('LocalStorage get failed:', error);
      return defaultValue;
    }
  },

  /**
   * Remove localStorage item
   * @param {string} key - Storage key name
   * @returns {boolean} - Whether operation was successful
   */
  remove(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('LocalStorage remove failed:', error);
      return false;
    }
  },

  /**
   * Clear localStorage
   * @returns {boolean} - Whether operation was successful
   */
  clear() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('LocalStorage clear failed:', error);
      return false;
    }
  },

  /**
   * Check if key exists in localStorage
   * @param {string} key - Storage key name
   * @returns {boolean} - Whether key exists
   */
  has(key) {
    return localStorage.getItem(key) !== null;
  },

  /**
   * Get all storage keys
   * @returns {string[]} - Array of all keys
   */
  keys() {
    return Object.keys(localStorage);
  },

  /**
   * Get localStorage used space (bytes)
   * @returns {number} - Used space
   */
  getSize() {
    let size = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        size += (localStorage[key].length + key.length) * 2; // UTF-16 characters take 2 bytes each
      }
    }
    return size;
  }
};

// SessionStorage Manager
export const SessionStorage = {
  /**
   * Set sessionStorage item
   * @param {string} key - Storage key name
   * @param {any} value - Storage value (will be JSON serialized)
   * @returns {boolean} - Whether operation was successful
   */
  set(key, value) {
    try {
      const serializedValue = JSON.stringify(value);
      sessionStorage.setItem(key, serializedValue);
      return true;
    } catch (error) {
      console.error('SessionStorage set failed:', error);
      return false;
    }
  },

  /**
   * Get sessionStorage item
   * @param {string} key - Storage key name
   * @param {any} defaultValue - Default value when value doesn't exist or parsing fails
   * @returns {any} - Storage value or default value
   */
  get(key, defaultValue = null) {
    try {
      const serializedValue = sessionStorage.getItem(key);
      if (serializedValue === null) return defaultValue;
      return JSON.parse(serializedValue);
    } catch (error) {
      console.error('SessionStorage get failed:', error);
      return defaultValue;
    }
  },

  /**
   * Remove sessionStorage item
   * @param {string} key - Storage key name
   * @returns {boolean} - Whether operation was successful
   */
  remove(key) {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('SessionStorage remove failed:', error);
      return false;
    }
  },

  /**
   * Clear sessionStorage
   * @returns {boolean} - Whether operation was successful
   */
  clear() {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('SessionStorage clear failed:', error);
      return false;
    }
  },

  /**
   * Check if key exists in sessionStorage
   * @param {string} key - Storage key name
   * @returns {boolean} - Whether key exists
   */
  has(key) {
    return sessionStorage.getItem(key) !== null;
  },

  /**
   * Get all storage keys
   * @returns {string[]} - Array of all keys
   */
  keys() {
    return Object.keys(sessionStorage);
  },

  /**
   * Get sessionStorage used space (bytes)
   * @returns {number} - Used space
   */
  getSize() {
    let size = 0;
    for (const key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        size += (sessionStorage[key].length + key.length) * 2; // UTF-16 characters take 2 bytes each
      }
    }
    return size;
  }
};

// Cookie Manager
export const CookieStorage = {
  /**
   * Set Cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Cookie options
   * @param {number} options.days - Valid days
   * @param {string} options.path - Cookie path
   * @param {string} options.domain - Cookie domain
   * @param {boolean} options.secure - Whether to send only via HTTPS
   * @param {boolean} options.sameSite - SameSite attribute ('strict', 'lax', 'none')
   * @returns {boolean} - Whether operation was successful
   */
  set(name, value, options = {}) {
    try {
      const {
        days = 7,
        path = '/',
        domain = '',
        secure = window.location.protocol === 'https:',
        sameSite = 'lax'
      } = options;

      // Build cookie string
      let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

      // Set expiration time
      if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        cookieString += `; expires=${date.toUTCString()}`;
      }

      // Add other options
      if (path) cookieString += `; path=${path}`;
      if (domain) cookieString += `; domain=${domain}`;
      if (secure) cookieString += '; secure';
      if (sameSite) cookieString += `; samesite=${sameSite}`;

      // Write cookie
      document.cookie = cookieString;
      return true;
    } catch (error) {
      console.error('Cookie set failed:', error);
      return false;
    }
  },

  /**
   * Get Cookie value
   * @param {string} name - Cookie name
   * @returns {string|null} - Cookie value or null (when not exists)
   */
  get(name, defaultValue = null) {
    try {
      const nameEQ = `${encodeURIComponent(name)}=`;
      const cookies = document.cookie.split(';');

      for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
          cookie = cookie.substring(1, cookie.length);
        }

        if (cookie.indexOf(nameEQ) === 0) {
          return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
        }
      }

      return defaultValue;
    } catch (error) {
      console.error('Cookie get failed:', error);
      return defaultValue;
    }
  },

  /**
   * Remove Cookie
   * @param {string} name - Cookie name
   * @param {Object} options - Cookie options
   * @param {string} options.path - Cookie path
   * @param {string} options.domain - Cookie domain
   * @returns {boolean} - Whether operation was successful
   */
  remove(name, options = {}) {
    try {
      const { path = '/', domain = '' } = options;

      // Delete cookie by setting expiration time to past
      document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT` +
        (path ? `; path=${path}` : '') +
        (domain ? `; domain=${domain}` : '');

      return true;
    } catch (error) {
      console.error('Cookie remove failed:', error);
      return false;
    }
  },

  /**
   * Check if Cookie exists
   * @param {string} name - Cookie name
   * @returns {boolean} - Whether Cookie exists
   */
  has(name) {
    return this.get(name) !== null;
  },

  /**
   * Get all Cookie names
   * @returns {string[]} - Array of Cookie names
   */
  keys() {
    const cookies = document.cookie.split(';');
    const keys = [];

    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i];
      while (cookie.charAt(0) === ' ') {
        cookie = cookie.substring(1, cookie.length);
      }

      const equalsPos = cookie.indexOf('=');
      if (equalsPos > 0) {
        keys.push(decodeURIComponent(cookie.substring(0, equalsPos)));
      }
    }

    return keys;
  }
};

// Unified export
export default {
  local: LocalStorage,
  session: SessionStorage,
  cookie: CookieStorage
};
