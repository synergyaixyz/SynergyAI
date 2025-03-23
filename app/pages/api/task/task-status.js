/**
 * API Route: Task Status
 *
 * Retrieves the status and results of a compute task.
 * Provides detailed information about the task's progress and completion.
 */

import { ethers } from 'ethers';
import { getTaskInfo, verifyTaskResults } from '../../../blockchain/contracts/ComputeManager';

export default async function handler(req, res) {
  // Allow both GET (for status) and POST (for verification)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  if (req.method === 'GET') {
    try {
      const { taskId, address, networkId, signature } = req.query;

      // Validate required fields
      if (!taskId || !address || !networkId || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const signatureMessage = `task-status:${taskId}:${Date.now().toString().slice(0, -3)}`;
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

      // Use server-side provider to get task info
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

      // Get task information from the blockchain
      const taskInfo = await getTaskInfo(provider, networkId, taskId);

      // Verify if the requester is the task owner
      if (taskInfo.owner.toLowerCase() !== address.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this task'
        });
      }

      // Return task status and information
      return res.status(200).json({
        success: true,
        taskId,
        status: getStatusFromTask(taskInfo),
        taskInfo: formatTaskInfo(taskInfo)
      });
    } catch (error) {
      console.error('Error retrieving task status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve task status',
        error: error.message
      });
    }
  } else if (req.method === 'POST') {
    // Handle task verification (accepting/rejecting results)
    try {
      const {
        taskId,
        accepted,
        feedback,
        address,
        networkId,
        signature
      } = req.body;

      // Validate required fields
      if (!taskId || accepted === undefined || !address || !networkId || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const signatureMessage = JSON.stringify({ taskId, accepted, feedback });
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

      // Use server-side provider to get task info and verify owner
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const taskInfo = await getTaskInfo(provider, networkId, taskId);

      // Verify if the requester is the task owner
      if (taskInfo.owner.toLowerCase() !== address.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to verify this task'
        });
      }

      // Check if the task is in a state that can be verified
      const taskStatus = getStatusFromTask(taskInfo);
      if (taskStatus !== 'completed') {
        return res.status(400).json({
          success: false,
          message: `Task cannot be verified in '${taskStatus}' status`
        });
      }

      // Use server-side signer to verify task results
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      // Send verification to blockchain
      const receipt = await verifyTaskResults(
        signer,
        networkId,
        taskId,
        accepted,
        feedback || ''
      );

      // Return verification result
      return res.status(200).json({
        success: true,
        taskId,
        verified: true,
        accepted,
        transactionHash: receipt.transactionHash
      });
    } catch (error) {
      console.error('Error verifying task results:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to verify task results',
        error: error.message
      });
    }
  }
}

/**
 * Determine task status from task information
 * @param {Object} taskInfo - Task information from the blockchain
 * @returns {string} Status string
 */
function getStatusFromTask(taskInfo) {
  if (taskInfo.cancelled) {
    return 'cancelled';
  }

  if (taskInfo.completed) {
    if (taskInfo.verified) {
      return taskInfo.accepted ? 'accepted' : 'rejected';
    }
    return 'completed';
  }

  if (taskInfo.assignedAt > 0) {
    return 'processing';
  }

  return 'pending';
}

/**
 * Format task information for client response
 * @param {Object} taskInfo - Task information from the blockchain
 * @returns {Object} Formatted task information
 */
function formatTaskInfo(taskInfo) {
  return {
    owner: taskInfo.owner,
    taskType: taskInfo.taskType,
    dataId: taskInfo.dataId,
    requirements: JSON.parse(taskInfo.requirements),
    maxPrice: ethers.utils.formatEther(taskInfo.maxPrice),
    assignedNode: taskInfo.assignedNode || null,
    assignedAt: taskInfo.assignedAt > 0 ? new Date(taskInfo.assignedAt * 1000) : null,
    estimatedCompletion: taskInfo.estimatedCompletion > 0 ? new Date(taskInfo.estimatedCompletion * 1000) : null,
    completed: taskInfo.completed,
    completedAt: taskInfo.completedAt > 0 ? new Date(taskInfo.completedAt * 1000) : null,
    resultLocation: taskInfo.resultLocation || null,
    resultMetadata: taskInfo.resultMetadata ? JSON.parse(taskInfo.resultMetadata) : null,
    verified: taskInfo.verified,
    accepted: taskInfo.accepted,
    feedback: taskInfo.feedback || null,
    cancelled: taskInfo.cancelled,
    createdAt: new Date(taskInfo.createdAt * 1000)
  };
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
