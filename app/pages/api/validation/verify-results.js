/**
 * API Route: Verify Results
 *
 * Handles task result verification and dispute resolution in the SynergyAI network.
 * Enables validation of computation results and resolution of disputes between task creators and compute nodes.
 */

import { ethers } from 'ethers';
import { verifySignature, encryptToString, decryptFromString } from '../../../utils/index';
import ComputeManagerABI from '../../../blockchain/abis/ComputeManagerABI.json';
import { NETWORK_CONFIG } from '../../../config/networkConfig';
import { pinJSONToIPFS } from '../../../utils/ipfsUtils';

export default async function handler(req, res) {
  // Handle POST requests for verification submission
  if (req.method === 'POST') {
    try {
      const {
        taskId,
        networkId,
        verifierAddress,
        verificationResult,
        verificationProof,
        signature
      } = req.body;

      // Validate required fields
      if (!taskId || !networkId || !verifierAddress || !verificationResult || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const message = JSON.stringify({
        action: 'verify-results',
        taskId,
        networkId,
        verificationResult,
        timestamp: Math.floor(Date.now() / 1000)
      });

      const isValidSignature = await verifySignature(verifierAddress, message, signature);

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Initialize provider and contract
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const computeManager = new ethers.Contract(
        NETWORK_CONFIG[networkId].computeManagerAddress,
        ComputeManagerABI,
        provider
      );

      // Get task info to determine if verification is allowed
      const taskInfo = await computeManager.getTaskInfo(taskId);

      // Verify task is in a verifiable state (completed but not yet finalized)
      if (!taskInfo || taskInfo.status !== 2) { // Assuming status 2 is "COMPLETED"
        return res.status(400).json({
          success: false,
          message: 'Task is not in a verifiable state'
        });
      }

      // Check if the verifier is authorized
      // This could be the task creator or a designated verification node
      if (verifierAddress.toLowerCase() !== taskInfo.owner.toLowerCase() &&
          !await isAuthorizedVerifier(verifierAddress, networkId)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized verifier'
        });
      }

      // Prepare verification data for blockchain and IPFS
      const verificationData = {
        taskId,
        verifier: verifierAddress,
        result: verificationResult, // true = verified correct, false = disputed
        proof: verificationProof || '',
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Pin verification data to IPFS
      const ipfsHash = await pinJSONToIPFS(verificationData);

      // Use server-side signer for the transaction
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const contract = computeManager.connect(signer);

      // Submit verification to blockchain
      const tx = await contract.submitResultVerification(
        taskId,
        verificationResult,
        ipfsHash
      );
      const receipt = await tx.wait();

      // Handle outcome based on verification result
      if (verificationResult) {
        // Result verified as correct - finalize rewards
        await finalizeRewards(taskId, networkId, signer);

        return res.status(200).json({
          success: true,
          message: 'Task result verified successfully',
          taskId,
          status: 'VERIFIED',
          ipfsHash,
          transactionHash: receipt.transactionHash
        });
      } else {
        // Result disputed - initiate dispute resolution
        await initiateDispute(taskId, ipfsHash, networkId, signer);

        return res.status(200).json({
          success: true,
          message: 'Dispute initiated successfully',
          taskId,
          status: 'DISPUTED',
          ipfsHash,
          transactionHash: receipt.transactionHash
        });
      }
    } catch (error) {
      console.error('Error processing verification:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process verification',
        error: error.message
      });
    }
  }

  // Handle GET requests for checking verification status
  else if (req.method === 'GET') {
    try {
      const { taskId, networkId } = req.query;

      // Validate required fields
      if (!taskId || !networkId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Initialize provider and contract
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const computeManager = new ethers.Contract(
        NETWORK_CONFIG[networkId].computeManagerAddress,
        ComputeManagerABI,
        provider
      );

      // Get verification status from blockchain
      const verificationInfo = await computeManager.getVerificationInfo(taskId);

      // Check if verification exists
      if (!verificationInfo || !verificationInfo.ipfsHash) {
        return res.status(404).json({
          success: false,
          message: 'No verification found for this task'
        });
      }

      // Get detailed verification info from IPFS if available
      let detailedInfo = {};
      if (verificationInfo.ipfsHash) {
        try {
          detailedInfo = await fetchFromIPFS(verificationInfo.ipfsHash);
        } catch (error) {
          console.error('Error fetching from IPFS:', error);
        }
      }

      // Format verification status
      const status = verificationInfo.verified
        ? 'VERIFIED'
        : (verificationInfo.disputed ? 'DISPUTED' : 'PENDING');

      return res.status(200).json({
        success: true,
        taskId,
        status,
        verifier: verificationInfo.verifier,
        timestamp: new Date(verificationInfo.timestamp.toNumber() * 1000).toISOString(),
        ipfsHash: verificationInfo.ipfsHash,
        details: detailedInfo
      });
    } catch (error) {
      console.error('Error retrieving verification status:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve verification status',
        error: error.message
      });
    }
  }

  // Handle PUT requests for dispute resolution
  else if (req.method === 'PUT') {
    try {
      const {
        taskId,
        networkId,
        resolverAddress,
        resolution,
        resolutionDetails,
        signature
      } = req.body;

      // Validate required fields
      if (!taskId || !networkId || !resolverAddress || resolution === undefined || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const message = JSON.stringify({
        action: 'resolve-dispute',
        taskId,
        networkId,
        resolution,
        timestamp: Math.floor(Date.now() / 1000)
      });

      const isValidSignature = await verifySignature(resolverAddress, message, signature);

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Check if resolver is authorized
      if (!await isAuthorizedResolver(resolverAddress, networkId)) {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized resolver'
        });
      }

      // Initialize provider and contract
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const computeManager = new ethers.Contract(
        NETWORK_CONFIG[networkId].computeManagerAddress,
        ComputeManagerABI,
        provider
      );

      // Get task and verification info
      const taskInfo = await computeManager.getTaskInfo(taskId);
      const verificationInfo = await computeManager.getVerificationInfo(taskId);

      // Verify task is in disputed state
      if (!verificationInfo || !verificationInfo.disputed) {
        return res.status(400).json({
          success: false,
          message: 'Task is not in a disputed state'
        });
      }

      // Prepare resolution data for blockchain and IPFS
      const resolutionData = {
        taskId,
        resolver: resolverAddress,
        resolution, // true = in favor of node, false = in favor of task creator
        details: resolutionDetails || '',
        timestamp: Math.floor(Date.now() / 1000)
      };

      // Pin resolution data to IPFS
      const ipfsHash = await pinJSONToIPFS(resolutionData);

      // Use server-side signer for the transaction
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const contract = computeManager.connect(signer);

      // Submit resolution to blockchain
      const tx = await contract.resolveDispute(
        taskId,
        resolution,
        ipfsHash
      );
      const receipt = await tx.wait();

      // Process based on resolution outcome
      if (resolution) {
        // Resolution in favor of compute node - finalize rewards
        await finalizeRewards(taskId, networkId, signer);
      } else {
        // Resolution in favor of task creator - penalize node
        await penalizeNode(taskInfo.executor, taskId, networkId, signer);
      }

      return res.status(200).json({
        success: true,
        message: 'Dispute resolved successfully',
        taskId,
        status: resolution ? 'RESOLVED_FOR_NODE' : 'RESOLVED_FOR_CREATOR',
        ipfsHash,
        transactionHash: receipt.transactionHash
      });
    } catch (error) {
      console.error('Error resolving dispute:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to resolve dispute',
        error: error.message
      });
    }
  }

  // Reject other HTTP methods
  else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}

/**
 * Check if an address is an authorized verifier
 * @param {string} address - Verifier address
 * @param {number} networkId - Network ID
 * @returns {Promise<boolean>} - Whether address is authorized
 */
async function isAuthorizedVerifier(address, networkId) {
  // Implementation depends on governance model
  // Could check if address is a validator node or has staked tokens

  // For now, using a simplified check
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    NETWORK_CONFIG[networkId].validatorRegistryAddress,
    ValidatorRegistryABI,
    provider
  );

  return await contract.isAuthorizedVerifier(address);
}

/**
 * Check if an address is an authorized dispute resolver
 * @param {string} address - Resolver address
 * @param {number} networkId - Network ID
 * @returns {Promise<boolean>} - Whether address is authorized
 */
async function isAuthorizedResolver(address, networkId) {
  // Implementation depends on governance model
  // Could check if address is a council member or has high reputation

  // For now, using a simplified check
  const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(
    NETWORK_CONFIG[networkId].governanceAddress,
    GovernanceABI,
    provider
  );

  return await contract.isDisputeResolver(address);
}

/**
 * Finalize rewards for a successfully verified task
 * @param {string} taskId - Task ID
 * @param {number} networkId - Network ID
 * @param {object} signer - Ethers signer
 * @returns {Promise<void>}
 */
async function finalizeRewards(taskId, networkId, signer) {
  const computeManager = new ethers.Contract(
    NETWORK_CONFIG[networkId].computeManagerAddress,
    ComputeManagerABI,
    signer
  );

  await computeManager.finalizeTaskRewards(taskId);
}

/**
 * Penalize a node for incorrect computation
 * @param {string} nodeAddress - Node address
 * @param {string} taskId - Task ID
 * @param {number} networkId - Network ID
 * @param {object} signer - Ethers signer
 * @returns {Promise<void>}
 */
async function penalizeNode(nodeAddress, taskId, networkId, signer) {
  const computeManager = new ethers.Contract(
    NETWORK_CONFIG[networkId].computeManagerAddress,
    ComputeManagerABI,
    signer
  );

  await computeManager.penalizeNode(nodeAddress, taskId);
}

/**
 * Initiate a dispute for a task
 * @param {string} taskId - Task ID
 * @param {string} ipfsHash - IPFS hash of dispute data
 * @param {number} networkId - Network ID
 * @param {object} signer - Ethers signer
 * @returns {Promise<void>}
 */
async function initiateDispute(taskId, ipfsHash, networkId, signer) {
  const computeManager = new ethers.Contract(
    NETWORK_CONFIG[networkId].computeManagerAddress,
    ComputeManagerABI,
    signer
  );

  await computeManager.initiateDispute(taskId, ipfsHash);
}

/**
 * Fetch data from IPFS
 * @param {string} ipfsHash - IPFS hash
 * @returns {Promise<object>} - JSON data from IPFS
 */
async function fetchFromIPFS(ipfsHash) {
  const response = await fetch(`${process.env.IPFS_GATEWAY_URL}/ipfs/${ipfsHash}`);
  if (!response.ok) {
    throw new Error(`IPFS fetch failed: ${response.statusText}`);
  }
  return await response.json();
}
