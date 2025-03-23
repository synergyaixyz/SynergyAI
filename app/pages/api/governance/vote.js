/**
 * API Route: /api/governance/vote
 *
 * Handles voting on governance proposals
 *
 * Method: POST
 *
 * Request Body:
 * {
 *   proposalId: number,
 *   support: boolean,
 *   address: string,
 *   networkId: number,
 *   signature: string
 * }
 *
 * Response:
 * {
 *   success: boolean,
 *   data: {
 *     transactionHash: string,
 *     proposal: {
 *       id: number,
 *       forVotes: string,
 *       againstVotes: string
 *     }
 *   } | null,
 *   error: string | null
 * }
 */

import { ethers } from 'ethers';
import providerService from '../../../services/providerService';

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
  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      data: null,
      error: 'Method not allowed'
    });
  }

  const { proposalId, support, address, networkId, signature } = req.body;

  // Validate required fields
  if (proposalId === undefined || support === undefined || !address || !networkId || !signature) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Missing required fields'
    });
  }

  // Validate proposal ID
  if (isNaN(proposalId) || proposalId < 1) {
    return res.status(400).json({
      success: false,
      data: null,
      error: 'Invalid proposal ID'
    });
  }

  try {
    // Verify signature
    const message = `Vote ${support ? 'For' : 'Against'} Proposal ${proposalId}`;
    const isValidSignature = verifySignature(address, message, signature);

    if (!isValidSignature) {
      return res.status(401).json({
        success: false,
        data: null,
        error: 'Invalid signature'
      });
    }

    // Get mock proposal data
    const proposal = getMockProposalById(proposalId);

    if (!proposal) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'Proposal not found'
      });
    }

    // Check if the proposal is active
    const now = Math.floor(Date.now() / 1000);
    if (now < proposal.startTime || now > proposal.endTime) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'Proposal is not active for voting'
      });
    }

    // In a real implementation, we would:
    // 1. Check if the user has already voted
    // 2. Verify the user has sufficient voting power
    // 3. Submit the transaction to the blockchain

    // For demo, simulate a successful vote
    const mockVotingPower = ethers.utils.parseEther('1000');

    // Update vote counts based on the vote
    if (support) {
      proposal.forVotes = ethers.BigNumber.from(proposal.forVotes).add(mockVotingPower);
    } else {
      proposal.againstVotes = ethers.BigNumber.from(proposal.againstVotes).add(mockVotingPower);
    }

    // Generate a mock transaction hash
    const transactionHash = `0x${Math.random().toString(16).substring(2)}`;

    // Return success response
    return res.status(200).json({
      success: true,
      data: {
        transactionHash,
        proposal: {
          id: proposal.id,
          forVotes: proposal.forVotes.toString(),
          againstVotes: proposal.againstVotes.toString()
        }
      },
      error: null
    });
  } catch (error) {
    console.error('Error processing vote:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'An error occurred while processing the vote'
    });
  }
}

/**
 * Get mock proposal data by ID
 * @param {number} id - The proposal ID
 * @returns {Object|null} Proposal data or null if not found
 */
function getMockProposalById(id) {
  // Convert to number to ensure correct comparison
  const proposalId = Number(id);

  // Mock data for demonstration
  const mockProposals = [
    {
      id: 1,
      title: 'Add Support for Arbitrum Network',
      proposer: '0x1234567890123456789012345678901234567890',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
      endTime: Math.floor(Date.now() / 1000) + 86400 * 2, // 2 days from now
      forVotes: ethers.utils.parseEther('15000'),
      againstVotes: ethers.utils.parseEther('5000'),
      executed: false,
      canceled: false
    },
    {
      id: 2,
      title: 'Increase Compute Task Reward Pool by 20%',
      proposer: '0x2345678901234567890123456789012345678901',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 10, // 10 days ago
      endTime: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
      forVotes: ethers.utils.parseEther('25000'),
      againstVotes: ethers.utils.parseEther('12000'),
      executed: true,
      canceled: false
    },
    {
      id: 3,
      title: 'Implement ZK-STARK Verification for Task Results',
      proposer: '0x3456789012345678901234567890123456789012',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
      endTime: Math.floor(Date.now() / 1000) + 86400 * 5, // 5 days from now
      forVotes: ethers.utils.parseEther('8000'),
      againstVotes: ethers.utils.parseEther('7000'),
      executed: false,
      canceled: false
    },
    {
      id: 4,
      title: 'Update SYN Token Staking Rewards Formula',
      proposer: '0x4567890123456789012345678901234567890123',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
      endTime: Math.floor(Date.now() / 1000) - 86400 * 1, // 1 day ago
      forVotes: ethers.utils.parseEther('18000'),
      againstVotes: ethers.utils.parseEther('22000'),
      executed: false,
      canceled: false
    },
    {
      id: 5,
      title: 'Treasury Diversification Strategy',
      proposer: '0x5678901234567890123456789012345678901234',
      startTime: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
      endTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
      forVotes: ethers.utils.parseEther('12000'),
      againstVotes: ethers.utils.parseEther('3000'),
      executed: false,
      canceled: false
    }
  ];

  // Find proposal with matching ID
  return mockProposals.find(p => p.id === proposalId) || null;
}
