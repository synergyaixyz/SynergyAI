/**
 * API Route: Fetch Dataset
 *
 * Retrieves dataset information including metadata and encryption keys
 * if the requesting user has proper access permissions.
 */

import { ethers } from 'ethers';
import {
  checkAccess,
  getDatasetMetadata,
  getEncryptionKey
} from '../../../blockchain/contracts/DataVault';

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { dataId, address, networkId, signature } = req.query;

    // Validate required fields
    if (!dataId || !address || !networkId || !signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify signature to authenticate the request
    const signatureMessage = `fetch-dataset:${dataId}:${Date.now().toString().slice(0, -3)}`;
    const isValidSignature = await verifySignature(
      address,
      signatureMessage,
      signature
    );

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Use server-side provider to check access permissions
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

    // Check if the user has access to the dataset
    const accessLevel = await checkAccess(provider, networkId, dataId, address);

    if (accessLevel < 1) { // 0 means no access
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this dataset'
      });
    }

    // Fetch dataset metadata
    const metadata = await getDatasetMetadata(provider, networkId, dataId);

    // Parse metadata
    let parsedMetadata;
    try {
      parsedMetadata = JSON.parse(metadata);
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to parse dataset metadata',
        error: error.message
      });
    }

    // Create response object
    const response = {
      success: true,
      dataId,
      metadata: parsedMetadata,
      accessLevel
    };

    // If user has read access or higher, provide encryption key if available
    // For this, we need to use the user's signer since key retrieval is personalized
    if (accessLevel >= 1) {
      // In a real implementation, we would require the user to submit this request
      // with their own signer. For demo purposes, we'll use our server signer.
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      try {
        const encryptionKey = await getEncryptionKey(signer, networkId, dataId);
        if (encryptionKey) {
          response.encryptionKey = encryptionKey;
        }
      } catch (error) {
        console.warn('Could not retrieve encryption key:', error);
        // Don't fail the request, just don't include the key
        response.keyMessage = 'Encryption key could not be retrieved';
      }
    }

    // Return success response
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching dataset:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dataset',
      error: error.message
    });
  }
}

/**
 * Verify signature to authenticate the request
 * @param {string} address - User's Ethereum address
 * @param {string} message - Original message that was signed
 * @param {string} signature - Signature to verify
 * @returns {boolean} Whether the signature is valid
 */
async function verifySignature(address, message, signature) {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
