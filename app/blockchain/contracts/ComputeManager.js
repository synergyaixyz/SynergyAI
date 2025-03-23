/**
 * ComputeManager.js
 *
 * Provides an interface for interacting with the SynergyAI compute network contracts.
 * Handles task creation, management, result verification, and compute node operations.
 */

import { ethers } from 'ethers';
import ComputeManagerABI from '../abis/ComputeManagerABI.json';
import TokenABI from '../abis/TokenABI.json';
import { NETWORK_CONFIG } from '../networks';

export class ComputeManager {
  constructor(signerOrProvider) {
    this.signerOrProvider = signerOrProvider;
    this.contracts = {};
  }

  /**
   * Initialize the compute manager contract based on the network
   * @param {number} networkId - Blockchain network ID
   * @returns {ethers.Contract} - The compute manager contract instance
   */
  getContract(networkId) {
    if (!this.contracts[networkId]) {
      const network = NETWORK_CONFIG[networkId];
      if (!network || !network.computeManagerAddress) {
        throw new Error(`Compute manager not supported on network ${networkId}`);
      }

      this.contracts[networkId] = new ethers.Contract(
        network.computeManagerAddress,
        ComputeManagerABI,
        this.signerOrProvider
      );
    }
    return this.contracts[networkId];
  }

  /**
   * Get the token contract
   * @param {number} networkId - Blockchain network ID
   * @returns {ethers.Contract} - The token contract instance
   */
  getTokenContract(networkId) {
    const network = NETWORK_CONFIG[networkId];
    if (!network || !network.tokenAddress) {
      throw new Error(`Token not supported on network ${networkId}`);
    }

    return new ethers.Contract(
      network.tokenAddress,
      TokenABI,
      this.signerOrProvider
    );
  }

  /**
   * Get user token balance
   * @param {string} account - User's wallet address
   * @param {number} networkId - Blockchain network ID
   * @returns {Promise<string>} - User's token balance in ether units
   */
  async getTokenBalance(account, networkId) {
    const tokenContract = this.getTokenContract(networkId);
    const balance = await tokenContract.balanceOf(account);
    return ethers.utils.formatEther(balance);
  }

  /**
   * Create a new compute task
   * @param {object} taskData - Task configuration data
   * @param {string} taskData.dataId - ID of the dataset to use
   * @param {string} taskData.taskType - Type of the task (ANALYSIS, TRAINING, etc)
   * @param {object} taskData.requirements - Task resource requirements
   * @param {string} taskData.maxBudget - Maximum budget for the task in AIP tokens
   * @param {string} taskData.code - Task code or configuration
   * @param {number} networkId - Blockchain network ID
   * @returns {Promise<string>} - ID of the created task
   */
  async createTask(taskData, networkId) {
    const contract = this.getContract(networkId);

    // Convert requirements object to JSON string
    const requirementsStr = JSON.stringify(taskData.requirements);

    // Convert budget to wei units
    const maxBudgetWei = ethers.utils.parseEther(taskData.maxBudget.toString());

    // Encode task code as base64 if needed
    const encodedCode = taskData.code; // In production, you may want to encode this

    // Create the task transaction
    const tx = await contract.createTask(
      taskData.dataId,
      taskData.taskType,
      requirementsStr,
      maxBudgetWei,
      encodedCode
    );

    // Wait for transaction to be mined
    const receipt = await tx.wait();

    // Extract task ID from event logs
    const event = receipt.events.find(e => e.event === 'TaskCreated');
    if (!event) {
      throw new Error('Task creation failed: Event not found in transaction logs');
    }

    return event.args.taskId.toString();
  }

  /**
   * Get tasks owned by a specific user
   * @param {string} owner - Address of the task owner
   * @param {number} networkId - Blockchain network ID
   * @returns {Promise<array>} - Array of task IDs
   */
  async getTasksByOwner(owner, networkId) {
    const contract = this.getContract(networkId);
    const taskIds = await contract.getTasksByOwner(owner);
    return taskIds.map(id => id.toString());
  }

  /**
   * Get detailed information about a task
   * @param {string} taskId - ID of the task
   * @param {number} networkId - Blockchain network ID
   * @returns {Promise<object>} - Task information object
   */
  async getTaskInfo(taskId, networkId) {
    const contract = this.getContract(networkId);
    const taskInfo = await contract.getTaskInfo(taskId);

    // Convert BigNumber values to strings for easier handling in UI
    return {
      id: taskId,
      owner: taskInfo.owner,
      dataId: taskInfo.dataId,
      taskType: taskInfo.taskType,
      requirements: taskInfo.requirements,
      maxPrice: taskInfo.maxPrice,
      createdAt: taskInfo.createdAt.toNumber(),
      assignedNode: taskInfo.assignedNode,
      assignedAt: taskInfo.assignedAt.toNumber(),
      estimatedCompletion: taskInfo.estimatedCompletion.toNumber(),
      completed: taskInfo.completed,
      completedAt: taskInfo.completedAt.toNumber(),
      resultLocation: taskInfo.resultLocation,
      resultMetadata: taskInfo.resultMetadata,
      verified: taskInfo.verified,
      accepted: taskInfo.accepted,
      feedback: taskInfo.feedback,
      cancelled: taskInfo.cancelled,
      cancelledAt: taskInfo.cancelledAt.toNumber()
    };
  }

  /**
   * Get compute task results
   * @param {string} taskId - ID of the task
   * @param {number} networkId - Blockchain network ID
   * @returns {Promise<object>} - Task results object
   */
  async getTaskResults(taskId, networkId) {
    const contract = this.getContract(networkId);
    const taskInfo = await contract.getTaskInfo(taskId);

    if (!taskInfo.completed) {
      throw new Error('Task has not been completed yet');
    }

    // In a real implementation, this would fetch the results from IPFS or another storage
    // using the resultLocation string from the taskInfo

    // Mock implementation for demonstration
    const mockResults = {
      summary: {
        status: 'success',
        executionTime: Math.floor(Math.random() * 3600) + 'seconds',
        resourcesUsed: {
          cpuTime: Math.floor(Math.random() * 3600) + 'seconds',
          memoryPeak: Math.floor(Math.random() * 8) + 'GB'
        }
      },
      details: {
        outputs: [
          { name: 'main_output', value: 'Result value ' + Math.random().toFixed(4) },
          { name: 'secondary_metric', value: 'Metric value ' + Math.random().toFixed(4) }
        ],
        logs: [
          { timestamp: Date.now() - 3600000, level: 'info', message: 'Task started' },
          { timestamp: Date.now() - 1800000, level: 'info', message: 'Processing data' },
          { timestamp: Date.now() - 60000, level: 'info', message: 'Task completed successfully' }
        ]
      }
    };

    return mockResults;
  }

  /**
   * Verify and provide feedback on task results
   * @param {string} taskId - ID of the task
   * @param {boolean} accept - Whether to accept the results
   * @param {string} feedback - Feedback on the results
   * @param {number} networkId - Blockchain network ID
   * @returns {Promise<object>} - Transaction receipt
   */
  async verifyTaskResults(taskId, accept, feedback, networkId) {
    const contract = this.getContract(networkId);
    const tx = await contract.verifyTaskResults(taskId, accept, feedback);
    return await tx.wait();
  }

  /**
   * Cancel a pending task
   * @param {string} taskId - ID of the task
   * @param {number} networkId - Blockchain network ID
   * @returns {Promise<object>} - Transaction receipt
   */
  async cancelTask(taskId, networkId) {
    const contract = this.getContract(networkId);
    const tx = await contract.cancelTask(taskId);
    return await tx.wait();
  }

  /**
   * Get available compute nodes
   * @param {number} networkId - Blockchain network ID
   * @returns {Promise<array>} - Array of compute node objects
   */
  async getAvailableNodes(networkId) {
    const contract = this.getContract(networkId);
    const nodeIds = await contract.getActiveNodes();

    const nodes = await Promise.all(
      nodeIds.map(async (nodeId) => {
        const nodeInfo = await contract.getNodeInfo(nodeId);

        return {
          id: nodeId.toString(),
          owner: nodeInfo.owner,
          nodeType: nodeInfo.nodeType,
          performance: nodeInfo.performance.toNumber(),
          specs: nodeInfo.specs,
          apiUrl: nodeInfo.apiUrl,
          active: nodeInfo.active,
          registeredAt: nodeInfo.registeredAt.toNumber(),
          totalTasksCompleted: nodeInfo.totalTasksCompleted.toNumber(),
          reputationScore: nodeInfo.reputationScore.toNumber() / 100 // Assuming score is stored as integer
        };
      })
    );

    return nodes;
  }

  /**
   * Register a new compute node
   * @param {object} nodeData - Node configuration data
   * @param {string} nodeData.nodeType - Type of the node (CPU, GPU, etc)
   * @param {number} nodeData.performance - Performance level (1-10)
   * @param {string} nodeData.specs - Node specifications
   * @param {string} nodeData.apiUrl - URL for the node's API
   * @param {number} networkId - Blockchain network ID
   * @returns {Promise<string>} - ID of the registered node
   */
  async registerNode(nodeData, networkId) {
    const contract = this.getContract(networkId);

    const tx = await contract.registerNode(
      nodeData.nodeType,
      nodeData.performance,
      nodeData.specs,
      nodeData.apiUrl
    );

    const receipt = await tx.wait();

    const event = receipt.events.find(e => e.event === 'NodeRegistered');
    if (!event) {
      throw new Error('Node registration failed: Event not found in transaction logs');
    }

    return event.args.nodeId.toString();
  }
}

export default ComputeManager;
