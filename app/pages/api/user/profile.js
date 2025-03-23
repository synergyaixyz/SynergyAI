/**
 * API Route: User Profile
 *
 * Handles fetching and updating user profile information.
 * Supports both GET (retrieve profile) and POST (update profile) operations.
 */

import { ethers } from 'ethers';
import { User } from '../../../models/User';
import { getNodesByOwner } from '../../../blockchain/contracts/ComputeManager';
import { getDatasetsByOwner } from '../../../blockchain/contracts/DataVault';

// Mock database of user profiles
// In production, this would be replaced with a real database
const userProfiles = new Map();

export default async function handler(req, res) {
  // Allow both GET (for retrieval) and POST (for updates)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    try {
      const { address, networkId, signature } = req.query;

      // Validate required fields
      if (!address || !networkId || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const signatureMessage = `get-profile:${address}:${Date.now().toString().slice(0, -3)}`;
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

      // Use server-side provider to get blockchain data
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

      // Fetch user profile from database or create a new one
      let userProfile = userProfiles.get(address.toLowerCase());

      if (!userProfile) {
        // Create a new user profile with blockchain data
        userProfile = await createDefaultProfile(address, networkId, provider);
        userProfiles.set(address.toLowerCase(), userProfile);
      } else {
        // Update blockchain-related data
        await updateBlockchainData(userProfile, networkId, provider);
      }

      // Return user profile
      return res.status(200).json({
        success: true,
        profile: userProfile.toJSON()
      });
    } catch (error) {
      console.error('Error retrieving user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile',
        error: error.message
      });
    }
  } else if (req.method === 'POST') {
    try {
      const {
        address,
        networkId,
        signature,
        profileUpdates
      } = req.body;

      // Validate required fields
      if (!address || !networkId || !signature || !profileUpdates) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const signatureMessage = JSON.stringify({
        action: 'update-profile',
        address,
        updates: profileUpdates
      });

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

      // Get existing user profile or create new one
      let userProfile = userProfiles.get(address.toLowerCase());

      if (!userProfile) {
        const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
        userProfile = await createDefaultProfile(address, networkId, provider);
      }

      // Update allowed fields (prevent updating sensitive or blockchain-derived fields)
      const allowedUpdates = [
        'username',
        'email',
        'avatar',
        'bio',
        'preferences'
      ];

      let updated = false;

      for (const field of allowedUpdates) {
        if (profileUpdates[field] !== undefined) {
          // Validate field if needed
          if (field === 'email' && profileUpdates.email && !validateEmail(profileUpdates.email)) {
            return res.status(400).json({
              success: false,
              message: 'Invalid email format'
            });
          }

          // Update the field
          userProfile[field] = profileUpdates[field];
          updated = true;
        }
      }

      if (updated) {
        // Update last active timestamp
        userProfile.lastActive = new Date();

        // Save to database
        userProfiles.set(address.toLowerCase(), userProfile);
      }

      // Return updated profile
      return res.status(200).json({
        success: true,
        profile: userProfile.toJSON(),
        updated
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
        error: error.message
      });
    }
  }
}

/**
 * Create a default user profile with blockchain data
 * @param {string} address - User's Ethereum address
 * @param {number} networkId - Blockchain network ID
 * @param {ethers.providers.Provider} provider - Ethereum provider
 * @returns {User} New user profile
 */
async function createDefaultProfile(address, networkId, provider) {
  // Create basic user profile
  const user = new User({
    id: `user-${address.slice(2, 10)}`,
    address: address,
    username: `user-${address.slice(2, 10)}`,
    joinedAt: new Date(),
    lastActive: new Date()
  });

  // Update with blockchain data
  await updateBlockchainData(user, networkId, provider);

  return user;
}

/**
 * Update user profile with blockchain data
 * @param {User} user - User profile to update
 * @param {number} networkId - Blockchain network ID
 * @param {ethers.providers.Provider} provider - Ethereum provider
 */
async function updateBlockchainData(user, networkId, provider) {
  try {
    // Get compute nodes owned by user
    const nodeIds = await getNodesByOwner(provider, networkId, user.address);
    user.computeResources = nodeIds.map(nodeId => ({ nodeId }));

    // Get datasets owned by user
    const datasetIds = await getDatasetsByOwner(provider, networkId, user.address);
    user.datasets = datasetIds;

    // In a full implementation, we would also fetch token balances from the blockchain
    // This is a simplified version that uses mock data
    user.synBalance = Math.floor(Math.random() * 1000);
    user.aipBalance = Math.floor(Math.random() * 10000);
    user.stakedAmount = Math.floor(Math.random() * 500);

    // Update last active timestamp
    user.lastActive = new Date();
  } catch (error) {
    console.error('Error updating blockchain data:', error);
    // Don't fail the whole operation if blockchain data can't be fetched
  }
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email is valid
 */
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
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
