import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import useWallet from './useWallet';
import providerService from '../services/providerService';

/**
 * Proposal status enum
 */
export const ProposalStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUCCEEDED: 'SUCCEEDED',
  DEFEATED: 'DEFEATED',
  EXECUTED: 'EXECUTED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED'
};

/**
 * Hook for interacting with governance functionality
 * @returns {Object} Governance methods and state
 */
export default function useGovernance() {
  const { account, isConnected, networkId, provider, signer } = useWallet();

  // State
  const [proposals, setProposals] = useState([]);
  const [votingPower, setVotingPower] = useState('0');
  const [loading, setLoading] = useState(false);
  const [votingLoading, setVotingLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userVotes, setUserVotes] = useState({});

  // Mock governance contract (would be replaced with actual contract in production)
  // This would likely be fetched from providerService in a real implementation
  const governanceContract = {
    address: '0x1234567890123456789012345678901234567890',
    getProposals: async () => {
      // Mock data for demonstration
      return [
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
          canceled: false
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
          canceled: false
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
          canceled: false
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
          canceled: false
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
          canceled: false
        }
      ];
    },
    getVotingPower: async (address) => {
      // Mock voting power calculation
      return ethers.utils.parseEther('1000');
    },
    hasVoted: async (proposalId, address) => {
      // Mock hasVoted check
      return Math.random() > 0.5;
    },
    vote: async (proposalId, support) => {
      // Mock vote submission
      console.log(`Vote submitted for proposal ${proposalId}, support: ${support}`);
      return { hash: `0x${Math.random().toString(16).substring(2)}` };
    },
    createProposal: async (title, description) => {
      // Mock proposal creation
      console.log(`Proposal created: ${title}`);
      return { hash: `0x${Math.random().toString(16).substring(2)}` };
    },
    executeProposal: async (proposalId) => {
      // Mock proposal execution
      console.log(`Executing proposal ${proposalId}`);
      return { hash: `0x${Math.random().toString(16).substring(2)}` };
    }
  };

  /**
   * Load proposals from blockchain
   */
  const loadProposals = useCallback(async () => {
    if (!isConnected) return;

    try {
      setLoading(true);
      setError(null);

      const proposalData = await governanceContract.getProposals();
      setProposals(proposalData);

      // Load voting information for user if connected
      if (account) {
        const userVotesMap = {};
        for (const proposal of proposalData) {
          userVotesMap[proposal.id] = await governanceContract.hasVoted(proposal.id, account);
        }
        setUserVotes(userVotesMap);
      }
    } catch (err) {
      console.error('Error loading proposals:', err);
      setError('Failed to load governance proposals. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [isConnected, account, governanceContract]);

  /**
   * Load user's voting power
   */
  const loadVotingPower = useCallback(async () => {
    if (!isConnected || !account) return;

    try {
      const power = await governanceContract.getVotingPower(account);
      setVotingPower(power.toString());
    } catch (err) {
      console.error('Error loading voting power:', err);
    }
  }, [isConnected, account, governanceContract]);

  /**
   * Cast a vote on a proposal
   * @param {number} proposalId - The proposal ID
   * @param {boolean} support - Whether to vote in support
   * @returns {Promise<Object>} Transaction result
   */
  const castVote = async (proposalId, support) => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      setVotingLoading(true);
      setError(null);

      const tx = await governanceContract.vote(proposalId, support);

      // Update local state to reflect the vote
      // In a real implementation, we would wait for transaction confirmation
      // and reload proposals from blockchain
      const updatedProposals = proposals.map(p => {
        if (p.id === proposalId) {
          const updatedProposal = { ...p };
          if (support) {
            updatedProposal.forVotes = ethers.BigNumber.from(p.forVotes).add(votingPower).toString();
          } else {
            updatedProposal.againstVotes = ethers.BigNumber.from(p.againstVotes).add(votingPower).toString();
          }
          return updatedProposal;
        }
        return p;
      });

      setProposals(updatedProposals);

      // Mark user as having voted
      setUserVotes(prev => ({
        ...prev,
        [proposalId]: true
      }));

      return tx;
    } catch (err) {
      console.error('Error casting vote:', err);
      setError(err.message || 'Failed to cast vote. Please try again.');
      throw err;
    } finally {
      setVotingLoading(false);
    }
  };

  /**
   * Create a new proposal
   * @param {string} title - Proposal title
   * @param {string} description - Proposal description
   * @param {string} proposalType - Proposal type
   * @returns {Promise<Object>} Transaction result
   */
  const createProposal = async (title, description, proposalType) => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await governanceContract.createProposal(title, description);

      // Add the new proposal to local state
      // In a real implementation, we would wait for transaction confirmation
      // and reload from blockchain
      const newProposal = {
        id: proposals.length + 1,
        title,
        description,
        proposer: account,
        startTime: Math.floor(Date.now() / 1000),
        endTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
        forVotes: ethers.utils.parseEther('0'),
        againstVotes: ethers.utils.parseEther('0'),
        executed: false,
        canceled: false,
        proposalType
      };

      setProposals([...proposals, newProposal]);

      return tx;
    } catch (err) {
      console.error('Error creating proposal:', err);
      setError(err.message || 'Failed to create proposal. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Execute a successful proposal
   * @param {number} proposalId - The proposal ID to execute
   * @returns {Promise<Object>} Transaction result
   */
  const executeProposal = async (proposalId) => {
    if (!isConnected || !account) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);
      setError(null);

      const tx = await governanceContract.executeProposal(proposalId);

      // Update local state to mark proposal as executed
      const updatedProposals = proposals.map(p => {
        if (p.id === proposalId) {
          return { ...p, executed: true };
        }
        return p;
      });

      setProposals(updatedProposals);

      return tx;
    } catch (err) {
      console.error('Error executing proposal:', err);
      setError(err.message || 'Failed to execute proposal. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Determine proposal status based on its data
   * @param {Object} proposal - The proposal object
   * @returns {string} Status string
   */
  const getProposalStatus = (proposal) => {
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
  };

  /**
   * Check if the user has voted on a proposal
   * @param {number} proposalId - The proposal ID
   * @returns {boolean} Whether the user has voted
   */
  const hasUserVoted = useCallback((proposalId) => {
    return userVotes[proposalId] || false;
  }, [userVotes]);

  // Load proposals and voting power when connected
  useEffect(() => {
    if (isConnected) {
      loadProposals();
      loadVotingPower();
    }
  }, [isConnected, loadProposals, loadVotingPower]);

  return {
    proposals,
    votingPower,
    loading,
    votingLoading,
    error,
    castVote,
    createProposal,
    executeProposal,
    getProposalStatus,
    hasUserVoted,
    refreshProposals: loadProposals
  };
}
