/**
 * API Route: Register Dataset
 *
 * Handles registration of datasets in the DataVault contract.
 * Validates dataset parameters and registers the dataset with proper access controls.
 */

import { ethers } from 'ethers';
import { registerDataset } from '../../../blockchain/contracts/DataVault';
import { uploadMetadata } from '../../../services/ipfsService';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      dataId,
      metadata,
      accessControlList,
      signature,
      address,
      networkId
    } = req.body;

    // Validate required fields
    if (!dataId || !metadata || !accessControlList || !signature || !address || !networkId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify signature to authenticate dataset owner
    const isValidSignature = await verifySignature(
      address,
      JSON.stringify({ dataId, metadata }),
      signature
    );

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Validate metadata
    if (!validateMetadata(metadata)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid metadata'
      });
    }

    // Validate access control list
    if (!validateAccessControlList(accessControlList)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid access control list'
      });
    }

    // Convert metadata to string if it's an object
    let metadataStr = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);

    // Use server-side signer to register dataset
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Upload additional metadata to IPFS if needed
    let extendedMetadataCid = null;
    if (metadata.extendedInfo) {
      extendedMetadataCid = await uploadMetadata(metadata.extendedInfo);

      // Add IPFS reference to metadata
      const updatedMetadata = {
        ...metadata,
        extendedInfoCid: extendedMetadataCid,
      };
      delete updatedMetadata.extendedInfo;

      metadataStr = JSON.stringify(updatedMetadata);
    }

    // Convert access control list to string if it's an object
    const accessControlListStr = typeof accessControlList === 'string'
      ? accessControlList
      : JSON.stringify(accessControlList);

    // Register dataset on blockchain
    const receipt = await registerDataset(
      signer,
      networkId,
      dataId,
      metadataStr,
      accessControlListStr
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Dataset registered successfully',
      dataId: dataId,
      transactionHash: receipt.transactionHash,
      extendedMetadataCid: extendedMetadataCid
    });
  } catch (error) {
    console.error('Error registering dataset:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register dataset',
      error: error.message
    });
  }
}

/**
 * Validate dataset metadata
 * @param {Object|string} metadata - Dataset metadata
 * @returns {boolean} Whether the metadata is valid
 */
function validateMetadata(metadata) {
  // Parse metadata if it's a string
  const metadataObj = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;

  // Required fields
  const requiredFields = ['name', 'description', 'dataType', 'size'];

  // Check if all required fields exist
  for (const field of requiredFields) {
    if (!metadataObj[field]) {
      return false;
    }
  }

  // Validate name length
  if (metadataObj.name.length < 3 || metadataObj.name.length > 100) {
    return false;
  }

  // Validate description length
  if (metadataObj.description.length < 10 || metadataObj.description.length > 1000) {
    return false;
  }

  // Validate data type
  const validDataTypes = ['csv', 'json', 'images', 'audio', 'video', 'text', 'mixed', 'other'];
  if (!validDataTypes.includes(metadataObj.dataType)) {
    return false;
  }

  // Validate size
  if (typeof metadataObj.size !== 'number' || metadataObj.size <= 0) {
    return false;
  }

  return true;
}

/**
 * Validate access control list
 * @param {Object|string} accessControlList - Access control list
 * @returns {boolean} Whether the access control list is valid
 */
function validateAccessControlList(accessControlList) {
  // Parse access control list if it's a string
  const aclObj = typeof accessControlList === 'string' ? JSON.parse(accessControlList) : accessControlList;

  // Check if it's an object
  if (typeof aclObj !== 'object' || aclObj === null) {
    return false;
  }

  // Check each address and access level
  for (const [address, accessLevel] of Object.entries(aclObj)) {
    // Validate Ethereum address format
    if (!ethers.utils.isAddress(address)) {
      return false;
    }

    // Validate access level (0: none, 1: read, 2: modify, 3: admin)
    if (![0, 1, 2, 3].includes(accessLevel)) {
      return false;
    }
  }

  return true;
}

/**
 * Verify signature to authenticate dataset owner
 * @param {string} address - Owner's Ethereum address
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
