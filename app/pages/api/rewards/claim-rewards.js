/**
 * API Route: Claim Rewards
 *
 * Handles reward claims for compute nodes and users in the SynergyAI network.
 * Enables withdrawing earned tokens for completed tasks and contributions.
 */

import { ethers } from 'ethers';
import { verifySignature } from '../../../utils/index';
import { claimRewards, getRewards } from '../../../blockchain/contracts/Tokens';

export default async function handler(req, res) {
  // Only allow POST method for claiming rewards
  if (req.method === 'POST') {
    try {
      const {
        address,
        signature,
        networkId,
        rewardType
      } = req.body;

      // Validate required fields
      if (!address || !signature || !networkId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const message = JSON.stringify({
        action: 'claim-rewards',
        timestamp: Math.floor(Date.now() / 1000)
      });

      const isValidSignature = await verifySignature(address, message, signature);

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Initialize provider and check available rewards
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const availableRewards = await getRewards(address, provider, networkId);

      // Check if there are rewards to claim
      if (availableRewards.eq(ethers.BigNumber.from(0))) {
        return res.status(400).json({
          success: false,
          message: 'No rewards available to claim'
        });
      }

      // Use server-side signer for the transaction
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

      // Claim the rewards
      const receipt = await claimRewards(
        address,
        rewardType || 'compute', // Default to compute rewards if not specified
        signer,
        networkId
      );

      // Format reward amount for the response
      const claimedAmount = ethers.utils.formatEther(availableRewards);

      return res.status(200).json({
        success: true,
        message: 'Rewards claimed successfully',
        address,
        amount: claimedAmount,
        rewardType: rewardType || 'compute',
        transactionHash: receipt.transactionHash
      });
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to claim rewards',
        error: error.message
      });
    }
  }

  // Handle GET method for checking available rewards
  else if (req.method === 'GET') {
    try {
      const { address, networkId } = req.query;

      // Validate required fields
      if (!address || !networkId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Initialize provider
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

      // Get rewards by type
      const computeRewards = await getRewards(address, provider, networkId, 'compute');
      const dataRewards = await getRewards(address, provider, networkId, 'data');
      const stakingRewards = await getRewards(address, provider, networkId, 'staking');
      const governanceRewards = await getRewards(address, provider, networkId, 'governance');

      // Format rewards for response
      const formattedRewards = {
        compute: ethers.utils.formatEther(computeRewards),
        data: ethers.utils.formatEther(dataRewards),
        staking: ethers.utils.formatEther(stakingRewards),
        governance: ethers.utils.formatEther(governanceRewards),
        total: ethers.utils.formatEther(
          computeRewards.add(dataRewards).add(stakingRewards).add(governanceRewards)
        )
      };

      return res.status(200).json({
        success: true,
        address,
        rewards: formattedRewards,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error retrieving rewards:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve rewards',
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
 * Calculate rewards breakdown for a specific user
 * @param {string} address - User's wallet address
 * @param {object} provider - Ethers provider
 * @param {number} networkId - Network ID
 * @returns {Promise<object>} - Detailed rewards breakdown
 */
async function getRewardsBreakdown(address, provider, networkId) {
  // Get completed tasks by the node
  const computeManager = new ethers.Contract(
    NETWORK_CONFIG[networkId].computeManagerAddress,
    ComputeManagerABI,
    provider
  );

  // Get completed task IDs
  const completedTaskIds = await computeManager.getCompletedTasksByNode(address);

  // Fetch details for each task
  const taskDetails = await Promise.all(
    completedTaskIds.map(async (taskId) => {
      const taskInfo = await computeManager.getTaskInfo(taskId);
      return {
        taskId: taskId.toString(),
        timestamp: new Date(taskInfo.completedAt.toNumber() * 1000).toISOString(),
        reward: ethers.utils.formatEther(taskInfo.reward),
        type: taskInfo.taskType
      };
    })
  );

  // Sort by timestamp (newest first)
  taskDetails.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Calculate totals by category
  const totals = taskDetails.reduce((acc, task) => {
    const category = task.type.toLowerCase();
    acc[category] = (acc[category] || 0) + parseFloat(task.reward);
    acc.total = (acc.total || 0) + parseFloat(task.reward);
    return acc;
  }, {});

  return {
    history: taskDetails,
    totals
  };
}
