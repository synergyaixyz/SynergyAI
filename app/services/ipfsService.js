import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

// Create IPFS client instance
// In production environment, consider using your own IPFS node or dedicated service
const ipfsClient = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
});

/**
 * Upload data to IPFS
 * @param {string|Buffer} data - Data to upload (string or Buffer)
 * @param {Object} options - Upload options
 * @returns {Promise<string>} - IPFS content identifier (CID)
 */
export const uploadToIPFS = async (data, options = {}) => {
  try {
    // Convert data to Buffer if it's a string
    const content = typeof data === 'string' 
      ? Buffer.from(data)
      : data;
    
    // Upload to IPFS
    const result = await ipfsClient.add(content, {
      pin: true, // Pin the data to keep it persistent
      ...options
    });
    
    // Return the content identifier (CID)
    return result.path;
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw new Error(`IPFS upload failed: ${error.message}`);
  }
};

/**
 * Get data from IPFS by CID
 * @param {string} cid - Content identifier
 * @returns {Promise<Buffer>} - Retrieved data as Buffer
 */
export const getFromIPFS = async (cid) => {
  try {
    const chunks = [];
    
    // Stream data from IPFS
    for await (const chunk of ipfsClient.cat(cid)) {
      chunks.push(chunk);
    }
    
    // Combine chunks into a single Buffer
    return Buffer.concat(chunks);
  } catch (error) {
    console.error('Error retrieving from IPFS:', error);
    throw new Error(`IPFS retrieval failed: ${error.message}`);
  }
};

/**
 * Generate IPFS gateway URL for a CID
 * @param {string} cid - Content identifier
 * @param {string} gateway - IPFS gateway URL (default: ipfs.io)
 * @returns {string} - HTTP URL to access the content
 */
export const getIPFSUrl = (cid, gateway = 'ipfs.io') => {
  return `https://${gateway}/ipfs/${cid}`;
};

/**
 * Upload metadata object to IPFS
 * @param {Object} metadata - Metadata object
 * @returns {Promise<string>} - IPFS content identifier (CID)
 */
export const uploadMetadata = async (metadata) => {
  try {
    const metadataString = JSON.stringify(metadata);
    return await uploadToIPFS(metadataString);
  } catch (error) {
    console.error('Error uploading metadata to IPFS:', error);
    throw error;
  }
};

/**
 * Get metadata from IPFS
 * @param {string} cid - Content identifier
 * @returns {Promise<Object>} - Metadata object
 */
export const getMetadata = async (cid) => {
  try {
    const data = await getFromIPFS(cid);
    return JSON.parse(data.toString());
  } catch (error) {
    console.error('Error retrieving metadata from IPFS:', error);
    throw error;
  }
}; 