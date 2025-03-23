import CryptoJS from 'crypto-js';

/**
 * Encrypt data with AES
 * @param {string} data - Data to encrypt
 * @param {string} key - Encryption key
 * @returns {string} - Encrypted data as string
 */
export const encryptData = (data, key) => {
  try {
    return CryptoJS.AES.encrypt(data, key).toString();
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
};

/**
 * Decrypt AES encrypted data
 * @param {string} encryptedData - Encrypted data
 * @param {string} key - Decryption key
 * @returns {string} - Decrypted data
 */
export const decryptData = (encryptedData, key) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data: Invalid key or corrupted data');
  }
};

/**
 * Generate a random encryption key
 * @param {number} length - Key length in bytes (default: 32)
 * @returns {string} - Random encryption key in hex format
 */
export const generateEncryptionKey = (length = 32) => {
  const randomWords = CryptoJS.lib.WordArray.random(length);
  return randomWords.toString(CryptoJS.enc.Hex);
};

/**
 * Create a key derivation from password
 * Uses PBKDF2 (Password-Based Key Derivation Function 2)
 * @param {string} password - User password
 * @param {string} salt - Salt for key derivation (optional)
 * @returns {Object} - Derived key and salt
 */
export const deriveKeyFromPassword = (password, salt = null) => {
  // Generate salt if not provided
  const useSalt = salt || CryptoJS.lib.WordArray.random(16).toString();
  
  // Derive key using PBKDF2
  const key = CryptoJS.PBKDF2(password, useSalt, {
    keySize: 256 / 32, // 256 bits
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256
  }).toString();
  
  return {
    key,
    salt: useSalt
  };
};

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} - Hash as hex string
 */
export const hashData = (data) => {
  return CryptoJS.SHA256(data).toString();
};

/**
 * Encrypt an object (converts to JSON first)
 * @param {Object} obj - Object to encrypt
 * @param {string} key - Encryption key
 * @returns {string} - Encrypted object as string
 */
export const encryptObject = (obj, key) => {
  const jsonStr = JSON.stringify(obj);
  return encryptData(jsonStr, key);
};

/**
 * Decrypt an encrypted object
 * @param {string} encryptedData - Encrypted object
 * @param {string} key - Decryption key
 * @returns {Object} - Decrypted object
 */
export const decryptObject = (encryptedData, key) => {
  const jsonStr = decryptData(encryptedData, key);
  return JSON.parse(jsonStr);
}; 