/**
 * API Route: /api/governance/list-proposals
 *
 * Retrieves a list of governance proposals from the blockchain
 *
 * Method: GET
 *
 * Query Parameters:
 * - status (optional): Filter proposals by status (active, pending, succeeded, defeated, executed, canceled)
 * - limit (optional): Maximum number of proposals to return
 * - offset (optional): Pagination offset
 * - voter (optional): Filter proposals by voter address (proposals the address has voted on)
 * - proposer (optional): Filter proposals by proposer address
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     proposals: Array<Proposal>,
 *     total: number,
 *     offset: number,
 *     limit: number
 *   } | null,
 *   error: string | null
 * }
 */

import { ethers } from 'ethers';
import providerService from '../../../services/providerService';

// Mock governance contract ABI (would be replaced with actual contract in production)
const GovernanceABI = [
  "function getProposals() view returns (tuple(uint256 id, string title, string description, address proposer, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, bool executed, bool canceled)[])",
  "function hasVoted(uint256 proposalId, address voter) view returns (bool)"
];

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

export default async function handler(req, res) {
  // Only allow GET method
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      data: null,
      error: 'Method not allowed'
    });
  }

  try {
    // Get query parameters
    const {
      status,
      limit = 20,
      offset = 0,
      voter,
      proposer
    } = req.query;

    // Validate limit and offset
    const parsedLimit = parseInt(limit);
    const parsedOffset = parseInt(offset);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid limit parameter (must be between 1 and 50)'
      });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Invalid offset parameter (must be non-negative)'
      });
    }

    // In a real implementation, we would connect to the governance contract
    // For demo, we'll use mock data
    // const provider = providerService.getProvider();
    // const governanceContract = new ethers.Contract(GOVERNANCE_CONTRACT_ADDRESS, GovernanceABI, provider);
    // const rawProposals = await governanceContract.getProposals();

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
        transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
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
        transactionHash: '0x2345678901abcdef2345678901abcdef2345678901abcdef2345678901abcdef'
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
        transactionHash: '0x3456789012abcdef3456789012abcdef3456789012abcdef3456789012abcdef'
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
        transactionHash: '0x4567890123abcdef4567890123abcdef4567890123abcdef4567890123abcdef'
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
        transactionHash: '0x5678901234abcdef5678901234abcdef5678901234abcdef5678901234abcdef'
      }
    ];

    // Add computed status to each proposal
    const proposals = mockProposals.map(proposal => ({
      ...proposal,
      status: getProposalStatus(proposal),
      forVotes: proposal.forVotes.toString(),
      againstVotes: proposal.againstVotes.toString()
    }));

    // Apply filters
    let filteredProposals = [...proposals];

    // Filter by status if provided
    if (status) {
      filteredProposals = filteredProposals.filter(p => p.status === status.toLowerCase());
    }

    // Filter by proposer if provided
    if (proposer) {
      filteredProposals = filteredProposals.filter(p =>
        p.proposer.toLowerCase() === proposer.toLowerCase()
      );
    }

    // Filter by voter if provided
    // In a real implementation, we would check if the voter has voted on each proposal
    // For demo, we'll randomly determine this
    if (voter) {
      // Simulate checking if voter has voted on each proposal
      const hasVotedMap = {};
      for (const proposal of proposals) {
        // In a real implementation, we would call governanceContract.hasVoted(proposal.id, voter)
        // For demo, we'll randomly determine this
        hasVotedMap[proposal.id] = Math.random() > 0.5;
      }

      filteredProposals = filteredProposals.filter(p => hasVotedMap[p.id]);
    }

    // Apply pagination
    const total = filteredProposals.length;
    const paginatedProposals = filteredProposals.slice(parsedOffset, parsedOffset + parsedLimit);

    // Return the proposals
    return res.status(200).json({
      success: true,
      data: {
        proposals: paginatedProposals,
        total,
        offset: parsedOffset,
        limit: parsedLimit
      },
      error: null
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'An error occurred while fetching proposals'
    });
  }
}
