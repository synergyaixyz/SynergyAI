/**
 * API Route: Update Dataset Access Control
 *
 * Handles updates to dataset access permissions in the DataVault contract.
 * Allows dataset owners to grant or revoke access to specific addresses.
 */

import { ethers } from 'ethers';
import {
  updateAccessControl,
  grantAccess,
  revokeAccess,
  checkAccess
} from '../../../blockchain/contracts/DataVault';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      dataId,
      operation, // 'update', 'grant', or 'revoke'
      newAccessControlList, // for 'update' operation
      userAddress, // for 'grant' or 'revoke' operations
      accessLevel, // for 'grant' operation
      signature,
      ownerAddress, // the dataset owner's address
      networkId
    } = req.body;

    // Validate required fields
    if (!dataId || !operation || !signature || !ownerAddress || !networkId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify signature to authenticate dataset owner
    const isValidSignature = await verifySignature(
      ownerAddress,
      JSON.stringify({ dataId, operation, userAddress, accessLevel, newAccessControlList }),
      signature
    );

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Use server-side provider to check owner access
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

    // Check if the requester has admin access to the dataset
    const accessStatus = await checkAccess(provider, networkId, dataId, ownerAddress);

    if (accessStatus < 3) { // 3 means admin access
      return res.status(403).json({
        success: false,
        message: 'You do not have admin access to this dataset'
      });
    }

    // Use server-side signer to perform operations
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    let receipt;

    // Perform the requested operation
    switch (operation) {
      case 'update':
        // Validate access control list for update operation
        if (!newAccessControlList) {
          return res.status(400).json({
            success: false,
            message: 'Missing new access control list for update operation'
          });
        }

        if (!validateAccessControlList(newAccessControlList)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid access control list'
          });
        }

        // Convert access control list to string if it's an object
        const accessControlListStr = typeof newAccessControlList === 'string'
          ? newAccessControlList
          : JSON.stringify(newAccessControlList);

        receipt = await updateAccessControl(
          signer,
          networkId,
          dataId,
          accessControlListStr
        );
        break;

      case 'grant':
        // Validate parameters for grant operation
        if (!userAddress || accessLevel === undefined) {
          return res.status(400).json({
            success: false,
            message: 'Missing user address or access level for grant operation'
          });
        }

        if (!ethers.utils.isAddress(userAddress)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid user address'
          });
        }

        if (![1, 2, 3].includes(accessLevel)) { // 1: read, 2: modify, 3: admin
          return res.status(400).json({
            success: false,
            message: 'Invalid access level. Must be 1 (read), 2 (modify), or 3 (admin)'
          });
        }

        receipt = await grantAccess(
          signer,
          networkId,
          dataId,
          userAddress,
          accessLevel
        );
        break;

      case 'revoke':
        // Validate parameters for revoke operation
        if (!userAddress) {
          return res.status(400).json({
            success: false,
            message: 'Missing user address for revoke operation'
          });
        }

        if (!ethers.utils.isAddress(userAddress)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid user address'
          });
        }

        receipt = await revokeAccess(
          signer,
          networkId,
          dataId,
          userAddress
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid operation. Must be "update", "grant", or "revoke"'
        });
    }

    // Return success response
    return res.status(200).json({
      success: true,
      message: `Access control ${operation} operation completed successfully`,
      dataId: dataId,
      transactionHash: receipt.transactionHash,
      operation: operation
    });
  } catch (error) {
    console.error('Error updating access control:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update access control',
      error: error.message
    });
  }
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
 * Verify signature to authenticate request
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
