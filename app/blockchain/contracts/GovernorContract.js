/**
 * GovernorContract.js
 *
 * SynergyAI Governance Contract Interface for managing DAO proposals and voting
 *
 * This contract is based on the OpenZeppelin Governor contract pattern, including proposal, voting, and execution functionalities
 */

import { ethers } from 'ethers';

/**
 * Governance Contract ABI
 */
const GovernorContractABI = [
  // Query functions
  "function name() view returns (string)",
  "function votingDelay() view returns (uint256)",
  "function votingPeriod() view returns (uint256)",
  "function proposalThreshold() view returns (uint256)",
  "function quorumNumerator() view returns (uint256)",
  "function quorumDenominator() view returns (uint256)",
  "function getVotes(address account, uint256 blockNumber) view returns (uint256)",
  "function hasVoted(uint256 proposalId, address account) view returns (bool)",
  "function state(uint256 proposalId) view returns (uint8)",
  "function proposalSnapshot(uint256 proposalId) view returns (uint256)",
  "function proposalDeadline(uint256 proposalId) view returns (uint256)",
  "function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)",
  "function getProposalDescription(uint256 proposalId) view returns (string)",

  // Transaction functions
  "function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)",
  "function castVote(uint256 proposalId, uint8 support) returns (uint256)",
  "function castVoteWithReason(uint256 proposalId, uint8 support, string reason) returns (uint256)",
  "function castVoteBySig(uint256 proposalId, uint8 support, uint8 v, bytes32 r, bytes32 s) returns (uint256)",
  "function queue(uint256 proposalId) returns (uint256)",
  "function execute(uint256 proposalId) returns (uint256)",
  "function cancel(uint256 proposalId) returns (uint256)",

  // Events
  "event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)",
  "event VoteCast(address indexed voter, uint256 proposalId, uint8 support, uint256 weight, string reason)",
  "event ProposalCanceled(uint256 proposalId)",
  "event ProposalQueued(uint256 proposalId, uint256 eta)",
  "event ProposalExecuted(uint256 proposalId)"
];

/**
 * Proposal state enumeration
 */
export const ProposalState = {
  PENDING: 0,    // Waiting for voting to start
  ACTIVE: 1,     // Voting in progress
  CANCELED: 2,   // Canceled
  DEFEATED: 3,   // Rejected
  SUCCEEDED: 4,  // Approved
  QUEUED: 5,     // Queued for execution
  EXPIRED: 6,    // Expired
  EXECUTED: 7    // Executed
};

/**
 * Vote options enumeration
 */
export const VoteType = {
  AGAINST: 0,    // Against
  FOR: 1,        // Support
  ABSTAIN: 2     // Abstain
};

/**
 * Governance Contract Interface Class
 */
class GovernorContract {
  /**
   * Constructor
   * @param {Object} provider - Ethereum provider
   * @param {string} contractAddress - Contract address
   */
  constructor(provider, contractAddress) {
    this.provider = provider;
    this.contractAddress = contractAddress;
    this.contract = new ethers.Contract(contractAddress, GovernorContractABI, provider);
    this.signer = null;
  }

  /**
   * Set signer
   * @param {Object} signer - Ethereum signer
   */
  connect(signer) {
    this.signer = signer;
    this.contract = this.contract.connect(signer);
    return this;
  }

  /**
   * Create proposal
   * @param {Array<string>} targets - List of target contract addresses
   * @param {Array<string>} values - ETH values for each call
   * @param {Array<string>} calldatas - Function data for each call
   * @param {string} description - Proposal description
   * @returns {Promise<Object>} Transaction receipt with proposal ID
   */
  async propose(targets, values, calldatas, description) {
    if (!this.signer) throw new Error("Signer required to send transactions");

    const tx = await this.contract.propose(targets, values, calldatas, description);
    const receipt = await tx.wait();

    // Extract proposal ID from event
    const event = receipt.events.find(e => e.event === 'ProposalCreated');
    const proposalId = event.args.proposalId;

    return {
      transactionHash: receipt.transactionHash,
      proposalId: proposalId.toString(),
      receipt
    };
  }

  /**
   * Get proposal state
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<number>} Proposal state enum value
   */
  async getProposalState(proposalId) {
    return this.contract.state(proposalId);
  }

  /**
   * Get proposal details
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<Object>} Proposal details
   */
  async getProposal(proposalId) {
    const [state, snapshot, deadline, votes, description] = await Promise.all([
      this.contract.state(proposalId),
      this.contract.proposalSnapshot(proposalId),
      this.contract.proposalDeadline(proposalId),
      this.contract.proposalVotes(proposalId),
      this.contract.getProposalDescription(proposalId)
    ]);

    return {
      id: proposalId,
      state,
      snapshot: snapshot.toString(),
      deadline: deadline.toString(),
      description,
      againstVotes: votes.againstVotes.toString(),
      forVotes: votes.forVotes.toString(),
      abstainVotes: votes.abstainVotes.toString()
    };
  }

  /**
   * Vote on a proposal
   * @param {string} proposalId - Proposal ID
   * @param {number} support - Support option (0=against, 1=for, 2=abstain)
   * @returns {Promise<Object>} Transaction receipt
   */
  async castVote(proposalId, support) {
    if (!this.signer) throw new Error("Signer required to send transactions");

    const tx = await this.contract.castVote(proposalId, support);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.transactionHash,
      receipt
    };
  }

  /**
   * Vote with reason
   * @param {string} proposalId - Proposal ID
   * @param {number} support - Support option (0=against, 1=for, 2=abstain)
   * @param {string} reason - Voting reason
   * @returns {Promise<Object>} Transaction receipt
   */
  async castVoteWithReason(proposalId, support, reason) {
    if (!this.signer) throw new Error("Signer required to send transactions");

    const tx = await this.contract.castVoteWithReason(proposalId, support, reason);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.transactionHash,
      receipt
    };
  }

  /**
   * Vote by signature
   * @param {string} proposalId - Proposal ID
   * @param {number} support - Support option (0=against, 1=for, 2=abstain)
   * @param {Object} signature - Signature object containing v, r, s
   * @returns {Promise<Object>} Transaction receipt
   */
  async castVoteBySig(proposalId, support, signature) {
    if (!this.signer) throw new Error("Signer required to send transactions");

    const { v, r, s } = signature;
    const tx = await this.contract.castVoteBySig(proposalId, support, v, r, s);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.transactionHash,
      receipt
    };
  }

  /**
   * Queue proposal for execution
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<Object>} Transaction receipt
   */
  async queueProposal(proposalId) {
    if (!this.signer) throw new Error("Signer required to send transactions");

    const tx = await this.contract.queue(proposalId);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.transactionHash,
      receipt
    };
  }

  /**
   * Execute proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<Object>} Transaction receipt
   */
  async executeProposal(proposalId) {
    if (!this.signer) throw new Error("Signer required to send transactions");

    const tx = await this.contract.execute(proposalId);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.transactionHash,
      receipt
    };
  }

  /**
   * Cancel proposal
   * @param {string} proposalId - Proposal ID
   * @returns {Promise<Object>} Transaction receipt
   */
  async cancelProposal(proposalId) {
    if (!this.signer) throw new Error("Signer required to send transactions");

    const tx = await this.contract.cancel(proposalId);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.transactionHash,
      receipt
    };
  }

  /**
   * Get user's voting power at a specific block
   * @param {string} account - User address
   * @param {string} blockNumber - Block number
   * @returns {Promise<string>} Voting power amount
   */
  async getVotes(account, blockNumber) {
    const votes = await this.contract.getVotes(account, blockNumber);
    return votes.toString();
  }

  /**
   * Check if user has voted on a proposal
   * @param {string} proposalId - Proposal ID
   * @param {string} account - User address
   * @returns {Promise<boolean>} Whether the user has voted
   */
  async hasVoted(proposalId, account) {
    return this.contract.hasVoted(proposalId, account);
  }

  /**
   * Get governance parameters
   * @returns {Promise<Object>} Governance parameters
   */
  async getGovernanceParameters() {
    const [name, votingDelay, votingPeriod, proposalThreshold, quorumNumerator, quorumDenominator] = await Promise.all([
      this.contract.name(),
      this.contract.votingDelay(),
      this.contract.votingPeriod(),
      this.contract.proposalThreshold(),
      this.contract.quorumNumerator(),
      this.contract.quorumDenominator()
    ]);

    return {
      name,
      votingDelay: votingDelay.toString(),
      votingPeriod: votingPeriod.toString(),
      proposalThreshold: proposalThreshold.toString(),
      quorumNumerator: quorumNumerator.toString(),
      quorumDenominator: quorumDenominator.toString(),
      quorumPercentage: (quorumNumerator * 100 / quorumDenominator).toFixed(2) + '%'
    };
  }
}

export default GovernorContract;
