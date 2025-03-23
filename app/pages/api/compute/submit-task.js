/**
 * API Route: Submit Compute Task
 *
 * Handles submission of computation tasks to the SynergyAI network.
 * Validates task parameters and submits the task to the ComputeManager contract.
 */

import { ethers } from 'ethers';
import { submitTask } from '../../../blockchain/contracts/ComputeManager';
import { checkAccess } from '../../../blockchain/contracts/DataVault';

export default async function handler(req, res) {
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const {
      taskType,
      dataId,
      requirements,
      resultEncryptionKey,
      maxPrice,
      signature,
      address,
      networkId
    } = req.body;

    // Validate required fields
    if (!taskType || !dataId || !requirements || !resultEncryptionKey ||
        !maxPrice || !signature || !address || !networkId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify signature to authenticate task submitter
    const isValidSignature = await verifySignature(
      address,
      JSON.stringify({ taskType, dataId, requirements, maxPrice }),
      signature
    );

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    // Validate task type
    if (!validateTaskType(taskType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid task type'
      });
    }

    // Validate requirements
    if (!validateRequirements(requirements)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid requirements specification'
      });
    }

    // Use server-side provider to check data access
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

    // Check if the user has access to the dataset
    const accessLevel = await checkAccess(provider, networkId, dataId, address);

    if (accessLevel < 1) { // 0 means no access
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this dataset'
      });
    }

    // Use server-side signer to submit task
    const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Submit task to blockchain
    const receipt = await submitTask(
      signer,
      networkId,
      taskType,
      dataId,
      JSON.stringify(requirements),
      resultEncryptionKey,
      maxPrice
    );

    // Extract task ID from transaction logs
    const taskId = extractTaskIdFromReceipt(receipt);

    // Return success response with task ID
    return res.status(200).json({
      success: true,
      message: 'Task submitted successfully',
      taskId: taskId,
      transactionHash: receipt.transactionHash,
      estimatedCompletion: estimateCompletionTime(requirements, taskType)
    });
  } catch (error) {
    console.error('Error submitting task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit task',
      error: error.message
    });
  }
}

/**
 * Validate task type
 * @param {string} taskType - Type of computation task
 * @returns {boolean} Whether the task type is valid
 */
function validateTaskType(taskType) {
  const validTaskTypes = [
    'data-analysis',
    'machine-learning',
    'deep-learning',
    'image-processing',
    'natural-language-processing',
    'custom'
  ];

  return validTaskTypes.includes(taskType);
}

/**
 * Validate computation requirements
 * @param {Object} requirements - Task requirements
 * @returns {boolean} Whether the requirements are valid
 */
function validateRequirements(requirements) {
  // Required fields
  const requiredFields = ['minCpu', 'minMemory', 'minStorage'];

  // Check if all required fields exist
  for (const field of requiredFields) {
    if (requirements[field] === undefined) {
      return false;
    }
  }

  // CPU validation
  if (requirements.minCpu < 1) {
    return false;
  }

  // Memory validation
  if (requirements.minMemory < 1) {
    return false;
  }

  // Storage validation
  if (requirements.minStorage < 1) {
    return false;
  }

  return true;
}

/**
 * Verify signature to authenticate task submitter
 * @param {string} address - Submitter's Ethereum address
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
 * Extract task ID from transaction receipt
 * @param {Object} receipt - Transaction receipt
 * @returns {string} Task ID
 */
function extractTaskIdFromReceipt(receipt) {
  // In production, parse the event logs to extract the task ID
  // For this example, we'll generate a unique ID
  return `task-${receipt.transactionHash.substring(2, 10)}`;
}

/**
 * Estimate task completion time based on requirements and task type
 * @param {Object} requirements - Task requirements
 * @param {string} taskType - Type of computation task
 * @returns {number} Estimated completion time in seconds
 */
function estimateCompletionTime(requirements, taskType) {
  // Base time in seconds
  let baseTime = 300; // 5 minutes

  // Adjust based on task type
  switch (taskType) {
    case 'machine-learning':
    case 'deep-learning':
      baseTime *= 6; // 30 minutes
      break;
    case 'image-processing':
      baseTime *= 3; // 15 minutes
      break;
    case 'natural-language-processing':
      baseTime *= 4; // 20 minutes
      break;
    case 'custom':
      baseTime *= 10; // 50 minutes
      break;
  }

  // Adjust based on CPU requirements
  baseTime += requirements.minCpu * 60;

  // Adjust based on memory requirements
  baseTime += (requirements.minMemory / 1024) * 120;

  // Adjust based on priority if specified
  if (requirements.priority === 'high') {
    baseTime *= 0.7; // 30% faster
  } else if (requirements.priority === 'low') {
    baseTime *= 1.5; // 50% slower
  }

  return Math.round(baseTime);
}
