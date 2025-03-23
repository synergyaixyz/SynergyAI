/**
 * Encryption Utilities
 *
 * Provides functionality for encrypting and decrypting data
 */

/**
 * Encrypt data using the specified key
 * @param {ArrayBuffer} data - The data to encrypt
 * @param {string} key - The encryption key
 * @returns {Promise<ArrayBuffer>} The encrypted data
 */
export async function encrypt(data, key) {
  try {
    // Generate a valid encryption key from the key string
    const cryptoKey = await generateCryptoKey(key);

    // Generate initialization vector
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the data
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      cryptoKey,
      data
    );

    // Combine the initialization vector and encrypted data
    const result = new Uint8Array(iv.byteLength + encryptedData.byteLength);
    result.set(iv, 0);
    result.set(new Uint8Array(encryptedData), iv.byteLength);

    return result.buffer;
  } catch (error) {
    console.error('Failed to encrypt data:', error);
    throw error;
  }
}

/**
 * Decrypt data using the specified key
 * @param {ArrayBuffer} data - The data to decrypt
 * @param {string} key - The decryption key
 * @returns {Promise<ArrayBuffer>} The decrypted data
 */
export async function decrypt(data, key) {
  try {
    // Generate a valid encryption key from the key string
    const cryptoKey = await generateCryptoKey(key);

    // Extract the initialization vector from the encrypted data
    const dataArray = new Uint8Array(data);
    const iv = dataArray.slice(0, 12);
    const encryptedData = dataArray.slice(12);

    // Decrypt the data
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      cryptoKey,
      encryptedData
    );

    return decryptedData;
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    throw error;
  }
}

/**
 * Generate a CryptoKey object from a key string
 * @param {string} keyString - The key string
 * @returns {Promise<CryptoKey>} CryptoKey object
 */
async function generateCryptoKey(keyString) {
  if (keyString.startsWith('0x')) {
    keyString = keyString.substring(2);
  }

  // Ensure the key length is correct (AES-256 requires 32 bytes)
  let keyBytes;
  if (keyString.length === 64) {
    // Assuming it's a hexadecimal representation
    keyBytes = hexToBytes(keyString);
  } else {
    // If it's not in the correct format, use SHA-256 hash to get an appropriate key
    keyBytes = await hashToBytes(keyString);
  }

  // Import as CryptoKey
  return await window.crypto.subtle.importKey(
    'raw',
    keyBytes,
    {
      name: 'AES-GCM',
      length: 256
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Convert a hexadecimal string to a byte array
 * @param {string} hex - Hexadecimal string
 * @returns {Uint8Array} Byte array
 */
function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Hash a string and return the byte array
 * @param {string} str - Input string
 * @returns {Promise<Uint8Array>} Byte array
 */
async function hashToBytes(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hashBuffer);
}

/**
 * Encrypt non-encrypted data such as JSON objects to a string
 * @param {*} data - The data to encrypt
 * @param {string} key - The encryption key
 * @returns {Promise<string>} Base64-encoded encrypted string
 */
export async function encryptToString(data, key) {
  try {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);

    // Convert string to byte array
    const encoder = new TextEncoder();
    const dataBytes = encoder.encode(jsonString);

    // Encrypt the data
    const encryptedData = await encrypt(dataBytes, key);

    // Convert encrypted data to Base64 string
    return arrayBufferToBase64(encryptedData);
  } catch (error) {
    console.error('Failed to encrypt data to string:', error);
    throw error;
  }
}

/**
 * Decrypt a string and parse to original data type
 * @param {string} encryptedString - Base64-encoded encrypted string
 * @param {string} key - Decryption key
 * @returns {Promise<*>} Decrypted data
 */
export async function decryptFromString(encryptedString, key) {
  try {
    // Convert Base64 string to byte array
    const encryptedData = base64ToArrayBuffer(encryptedString);

    // Decrypt the data
    const decryptedData = await decrypt(encryptedData, key);

    // Convert byte array to string
    const decoder = new TextDecoder();
    const jsonString = decoder.decode(decryptedData);

    // Parse JSON string
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Failed to decrypt data from string:', error);
    throw error;
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - Input buffer
 * @returns {string} Base64 string
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string
 * @returns {ArrayBuffer} Output buffer
 */
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate a random encryption key
 * @param {number} [length=32] - Key length (in bytes)
 * @returns {string} Random key in hexadecimal format
 */
export function generateRandomKey(length = 32) {
  const randomBytes = window.crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
