/**
 * API Route: Register Compute Node
 *
 * Handles compute node registration in the SynergyAI network.
 * This endpoint validates node specifications and registers the node with the ComputeManager contract.
 */

import { ethers } from 'ethers';
import { registerNode } from '../../../blockchain/contracts/ComputeManager';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      nodeSpecs,
      availabilityScore,
      nodeUrl,
      signature,
      address,
      networkId
    } = req.body;

    // Validate required fields
    if (!nodeSpecs || !nodeUrl || !signature || !address || !networkId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Validate node specifications
    if (!validateNodeSpecs(nodeSpecs)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid node specifications'
      });
    }

    // Verify signature to authenticate node owner
    const isValidSignature = await verifySignature(
      address,
      JSON.stringify(nodeSpecs),
      signature
    );

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Use server-side signer to register node
    // This is a simplified example - in production, use proper key management
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Register node on blockchain
    const receipt = await registerNode(
      signer,
      networkId,
      nodeSpecs,
      availabilityScore || 80, // Default availability score if not provided
      nodeUrl
    );

    // Extract node ID from transaction logs
    const nodeId = extractNodeIdFromReceipt(receipt);

    // Return success response with node ID
    return res.status(200).json({
      success: true,
      message: 'Node registered successfully',
      nodeId: nodeId,
      transactionHash: receipt.transactionHash
    });
  } catch (error) {
    console.error('Error registering node:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to register node',
      error: error.message
    });
  }
}

/**
 * Validate node specifications
 * @param {Object} specs - Node specifications
 * @returns {boolean} Whether the specifications are valid
 */
function validateNodeSpecs(specs) {
  // Required fields
  const requiredFields = ['cpu', 'memory', 'storage'];

  // Check if all required fields exist
  for (const field of requiredFields) {
    if (!specs[field]) {
      return false;
    }
  }

  // CPU validation
  if (!specs.cpu.cores || !specs.cpu.model || specs.cpu.cores < 1) {
    return false;
  }

  // Memory validation
  if (!specs.memory.total || specs.memory.total < 1) {
    return false;
  }

  // Storage validation
  if (!specs.storage.available || specs.storage.available < 1) {
    return false;
  }

  return true;
}

/**
 * Verify signature to authenticate node owner
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

/**
 * Extract node ID from transaction receipt
 * @param {Object} receipt - Transaction receipt
 * @returns {string} Node ID
 */
function extractNodeIdFromReceipt(receipt) {
  // In production, parse the event logs to extract the node ID
  // For this example, we'll generate a unique ID
  return `node-${receipt.transactionHash.substring(2, 10)}`;
}
