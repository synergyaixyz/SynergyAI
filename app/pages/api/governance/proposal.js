/**
 * API Route: /api/governance/proposal
 *
 * GET: Retrieves details of a specific governance proposal
 * POST: Creates a new governance proposal
 *
 * Query Parameters (GET):
 * - id: The ID of the proposal to retrieve
 *
 * Request Body (POST):
 * {
 *   title: string,
 *   description: string,
 *   proposalType: string,
 *   actions: Array<{
 *     target: string,
 *     value: string,
 *     signature: string,
 *     calldata: string
 *   }>,
 *   address: string,
 *   networkId: number,
 *   signature: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: Proposal | { proposalId: number, transactionHash: string } | null,
 *   error: string | null
 * }
 */

import { ethers } from 'ethers';
import providerService from '../../../services/providerService';

// Proposal status enum
const ProposalStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  SUCCEEDED: 'succeeded',
  DEFEATED: 'defeated',
  EXECUTED: 'executed',
  CANCELED: 'canceled',
  EXPIRED: 'expired'
};

/**
 * Get proposal status based on its data
 * @param {Object} proposal - The proposal object
 * @returns {string} Status string
 */
function getProposalStatus(proposal) {
  const now = Math.floor(Date.now() / 1000);

  if (proposal.executed) return ProposalStatus.EXECUTED;
  if (proposal.canceled) return ProposalStatus.CANCELED;

  if (now < proposal.startTime) return ProposalStatus.PENDING;
  if (now <= proposal.endTime) return ProposalStatus.ACTIVE;

  if (now > proposal.endTime) {
    if (ethers.BigNumber.from(proposal.forVotes).gt(proposal.againstVotes)) {
      return ProposalStatus.SUCCEEDED;
    }
    return ProposalStatus.DEFEATED;
  }

  return ProposalStatus.EXPIRED;
}

/**
 * Verify signature to authenticate request
 * @param {string} address - The address that signed the message
 * @param {string} message - The message that was signed
 * @param {string} signature - The signature to verify
 * @returns {boolean} Whether the signature is valid
 */
function verifySignature(address, message, signature) {
  try {
    const recoveredAddress = ethers.utils.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

export default async function handler(req, res) {
  // Switch based on HTTP method
  switch (req.method) {
    case 'GET':
      return handleGetProposal(req, res);
    case 'POST':
      return handleCreateProposal(req, res);
    default:
      return res.status(405).json({
        success: false,
        data: null,
        error: 'Method not allowed'
      });
  }
}

/**
 * Handle GET request to fetch proposal details
 */
async function handleGetProposal(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Proposal ID is required'
    });
  }

  try {
    // Parse proposal ID
    const proposalId = parseInt(id);

    if (isNaN(proposalId) || proposalId < 1) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid proposal ID'
      });
    }

    // In a real implementation, we would fetch the proposal from the blockchain
    // For demo, we'll use mock data
    const proposalData = getMockProposalById(proposalId);

    if (!proposalData) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Proposal not found'
      });
    }

    // Add computed status to the proposal
    const proposal = {
      ...proposalData,
      status: getProposalStatus(proposalData),
      forVotes: proposalData.forVotes.toString(),
      againstVotes: proposalData.againstVotes.toString()
    };

    // Return the proposal details
    return res.status(200).json({
      success: true,
      data: proposal,
      error: null
    });
  } catch (error) {
    console.error('Error fetching proposal:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'An error occurred while fetching the proposal'
    });
  }
}

/**
 * Handle POST request to create a new proposal
 */
async function handleCreateProposal(req, res) {
  const {
    title,
    description,
    proposalType,
    actions,
    address,
    networkId,
    signature
  } = req.body;

  // Validate required fields
  if (!title || !description || !proposalType || !address || !networkId || !signature) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required fields'
    });
  }

  // Validate title length
  if (title.length < 5 || title.length > 100) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Title must be between 5 and 100 characters'
    });
  }

  // Validate description length
  if (description.length < 100 || description.length > 10000) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Description must be between 100 and 10000 characters'
    });
  }

  try {
    // Verify signature
    const message = `Create Proposal: ${title}`;
    const isValidSignature = verifySignature(address, message, signature);

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid signature'
      });
    }

    // In a real implementation, we would verify the user has sufficient voting power
    // to create a proposal and then submit the transaction to the blockchain

    // For demo, we'll just simulate a successful transaction
    const transactionHash = `0x${Math.random().toString(16).substring(2)}`;
    const proposalId = Math.floor(Math.random() * 1000) + 6; // Generate a new ID (existing mock IDs are 1-5)

    // Return success response
    return res.status(201).json({
      success: true,
      data: {
        proposalId,
        transactionHash
      },
      error: null
    });
  } catch (error) {
    console.error('Error creating proposal:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'An error occurred while creating the proposal'
    });
  }
}

/**
 * Get mock proposal data by ID
 * @param {number} id - The proposal ID
 * @returns {Object|null} Proposal data or null if not found
 */
function getMockProposalById(id) {
  // Mock data for demonstration
  const mockProposals = [
    {
      id: 1,
      title: 'Add Support for Arbitrum Network',
      description: 'Proposal to add Arbitrum network support to SynergyAI, allowing users to deploy and interact with contracts on Arbitrum.',
      proposer: '0x1234567890123456789012345678901234567890',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
      endTime: Math.floor(Date.now() / 1000) + 86400 * 2, // 2 days from now
      forVotes: ethers.utils.parseEther('15000'),
      againstVotes: ethers.utils.parseEther('5000'),
      executed: false,
      canceled: false,
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      proposalType: 'integration',
      actions: [
        {
          target: '0x1234567890123456789012345678901234567890',
          value: '0',
          signature: 'addSupportedNetwork(uint256,string)',
          calldata: ethers.utils.defaultAbiCoder.encode(['uint256', 'string'], [42161, 'Arbitrum'])
        }
      ],
      voteCount: 247,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 6 // 6 days ago
    },
    {
      id: 2,
      title: 'Increase Compute Task Reward Pool by 20%',
      description: 'Proposal to increase the reward pool for compute providers by 20% to incentivize more nodes to join the network.',
      proposer: '0x2345678901234567890123456789012345678901',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 10, // 10 days ago
      endTime: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
      forVotes: ethers.utils.parseEther('25000'),
      againstVotes: ethers.utils.parseEther('12000'),
      executed: true,
      canceled: false,
      transactionHash: '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef',
      proposalType: 'parameter',
      actions: [
        {
          target: '0x2345678901234567890123456789012345678901',
          value: '0',
          signature: 'setRewardMultiplier(uint256)',
          calldata: ethers.utils.defaultAbiCoder.encode(['uint256'], [120])
        }
      ],
      voteCount: 198,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 11 // 11 days ago
    },
    {
      id: 3,
      title: 'Implement ZK-STARK Verification for Task Results',
      description: 'Proposal to implement ZK-STARK verification for compute task results to enhance trust and accuracy of computation proofs.',
      proposer: '0x3456789012345678901234567890123456789012',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
      endTime: Math.floor(Date.now() / 1000) + 86400 * 5, // 5 days from now
      forVotes: ethers.utils.parseEther('8000'),
      againstVotes: ethers.utils.parseEther('7000'),
      executed: false,
      canceled: false,
      transactionHash: '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef',
      proposalType: 'upgrade',
      actions: [
        {
          target: '0x3456789012345678901234567890123456789012',
          value: '0',
          signature: 'upgradeToVersion(string)',
          calldata: ethers.utils.defaultAbiCoder.encode(['string'], ['v2.0.0-zk'])
        }
      ],
      voteCount: 76,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 3 // 3 days ago
    },
    {
      id: 4,
      title: 'Update SYN Token Staking Rewards Formula',
      description: 'Proposal to update the SYN token staking rewards formula to better align incentives with network growth and usage.',
      proposer: '0x4567890123456789012345678901234567890123',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
      endTime: Math.floor(Date.now() / 1000) - 86400 * 1, // 1 day ago
      forVotes: ethers.utils.parseEther('18000'),
      againstVotes: ethers.utils.parseEther('22000'),
      executed: false,
      canceled: false,
      transactionHash: '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef',
      proposalType: 'parameter',
      actions: [
        {
          target: '0x4567890123456789012345678901234567890123',
          value: '0',
          signature: 'updateRewardFormula(uint256,uint256,uint256)',
          calldata: ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256', 'uint256'], [5, 10, 100])
        }
      ],
      voteCount: 156,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 8 // 8 days ago
    },
    {
      id: 5,
      title: 'Treasury Diversification Strategy',
      description: 'Proposal to diversify treasury holdings across multiple stable assets to reduce volatility risks.',
      proposer: '0x5678901234567890123456789012345678901234',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
      endTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
      forVotes: ethers.utils.parseEther('12000'),
      againstVotes: ethers.utils.parseEther('3000'),
      executed: false,
      canceled: false,
      transactionHash: '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef',
      proposalType: 'funding',
      actions: [
        {
          target: '0x5678901234567890123456789012345678901234',
          value: '0',
          signature: 'allocateFunds(address[],uint256[])',
          calldata: ethers.utils.defaultAbiCoder.encode(
            ['address[]', 'uint256[]'],
            [
              ['0xabc...', '0xdef...', '0xghi...'],
              [ethers.utils.parseEther('1000000'), ethers.utils.parseEther('500000'), ethers.utils.parseEther('250000')]
            ]
          )
        }
      ],
      voteCount: 89,
      createdAt: Math.floor(Date.now() / 1000) - 86400 * 4 // 4 days ago
    }
  ];

  // Find proposal with matching ID
  return mockProposals.find(p => p.id === id) || null;
}
