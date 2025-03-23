/**
 * API Route: Propose and Vote Governance
 *
 * Handles creation of governance proposals and voting in the SynergyAI network.
 * Enables decentralized decision-making for protocol parameters and network upgrades.
 */

import { ethers } from 'ethers';
import { verifySignature } from '../../../utils/index';
import { NETWORK_CONFIG } from '../../../config/networkConfig';
import GovernanceABI from '../../../blockchain/abis/GovernanceABI.json';
import SYNTokenABI from '../../../blockchain/abis/SYNTokenABI.json';
import { pinJSONToIPFS } from '../../../utils/ipfsUtils';

export default async function handler(req, res) {
  // Handle POST requests for creating a proposal
  if (req.method === 'POST') {
    try {
      const {
        title,
        description,
        actions,
        proposerAddress,
        networkId,
        signature
      } = req.body;

      // Validate required fields
      if (!title || !description || !proposerAddress || !networkId || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const message = JSON.stringify({
        action: 'create-proposal',
        title,
        proposerAddress,
        timestamp: Math.floor(Date.now() / 1000)
      });

      const isValidSignature = await verifySignature(proposerAddress, message, signature);

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Initialize provider and contract
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

      // Check if proposer has enough tokens to create a proposal
      const synToken = new ethers.Contract(
        NETWORK_CONFIG[networkId].synTokenAddress,
        SYNTokenABI,
        provider
      );

      const proposalThreshold = await synToken.getProposalThreshold();
      const proposerBalance = await synToken.balanceOf(proposerAddress);

      if (proposerBalance.lt(proposalThreshold)) {
        return res.status(403).json({
          success: false,
          message: `Insufficient SYN tokens to create a proposal. Required: ${ethers.utils.formatEther(proposalThreshold)} SYN`
        });
      }

      // Prepare proposal data for blockchain and IPFS
      const proposalData = {
        title,
        description,
        proposer: proposerAddress,
        actions: actions || [],
        createdAt: Math.floor(Date.now() / 1000)
      };

      // Pin proposal data to IPFS
      const ipfsHash = await pinJSONToIPFS(proposalData);

      // Use server-side signer for the transaction
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const governance = new ethers.Contract(
        NETWORK_CONFIG[networkId].governanceAddress,
        GovernanceABI,
        signer
      );

      // Format actions for on-chain proposal
      let targets = [];
      let values = [];
      let calldatas = [];
      let descriptions = [];

      if (actions && actions.length > 0) {
        actions.forEach(action => {
          targets.push(action.target);
          values.push(action.value || 0);
          calldatas.push(action.calldata || '0x');
          descriptions.push(action.description || '');
        });
      }

      // Submit proposal to blockchain
      const tx = await governance.propose(
        targets,
        values,
        calldatas,
        `${title} - IPFS: ${ipfsHash}`
      );
      const receipt = await tx.wait();

      // Extract proposal ID from events
      const proposalId = extractProposalId(receipt);

      return res.status(200).json({
        success: true,
        message: 'Proposal created successfully',
        proposalId,
        title,
        ipfsHash,
        transactionHash: receipt.transactionHash
      });
    } catch (error) {
      console.error('Error creating proposal:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create proposal',
        error: error.message
      });
    }
  }

  // Handle GET requests for fetching proposals
  else if (req.method === 'GET') {
    try {
      const { proposalId, status, networkId } = req.query;

      // Validate networkId
      if (!networkId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Initialize provider and contract
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const governance = new ethers.Contract(
        NETWORK_CONFIG[networkId].governanceAddress,
        GovernanceABI,
        provider
      );

      // Fetch specific proposal if proposalId is provided
      if (proposalId) {
        const proposalState = await governance.state(proposalId);
        const proposalData = await governance.getProposal(proposalId);

        // Get IPFS data if available
        let ipfsData = {};
        if (proposalData.ipfsHash) {
          try {
            ipfsData = await fetchFromIPFS(proposalData.ipfsHash);
          } catch (error) {
            console.error('Error fetching from IPFS:', error);
          }
        }

        // Format proposal data
        const formattedProposal = {
          id: proposalId,
          title: ipfsData.title || extractTitleFromDescription(proposalData.description),
          description: ipfsData.description || proposalData.description,
          proposer: proposalData.proposer,
          status: formatProposalState(proposalState),
          forVotes: ethers.utils.formatEther(proposalData.forVotes),
          againstVotes: ethers.utils.formatEther(proposalData.againstVotes),
          abstainVotes: ethers.utils.formatEther(proposalData.abstainVotes),
          startBlock: proposalData.startBlock.toString(),
          endBlock: proposalData.endBlock.toString(),
          ipfsHash: proposalData.ipfsHash || '',
          actions: ipfsData.actions || []
        };

        return res.status(200).json({
          success: true,
          proposal: formattedProposal
        });
      }

      // Fetch all proposals or filtered by status
      else {
        const proposalCount = await governance.getProposalCount();
        let proposals = [];

        for (let i = proposalCount.toNumber(); i >= 1; i--) {
          const proposalState = await governance.state(i);

          // Filter by status if provided
          if (status && formatProposalState(proposalState).toLowerCase() !== status.toLowerCase()) {
            continue;
          }

          const proposalData = await governance.getProposal(i);

          // Get IPFS data if available
          let ipfsData = {};
          if (proposalData.ipfsHash) {
            try {
              ipfsData = await fetchFromIPFS(proposalData.ipfsHash);
            } catch (error) {
              console.error('Error fetching from IPFS:', error);
            }
          }

          // Format proposal data for the list
          proposals.push({
            id: i,
            title: ipfsData.title || extractTitleFromDescription(proposalData.description),
            proposer: proposalData.proposer,
            status: formatProposalState(proposalState),
            forVotes: ethers.utils.formatEther(proposalData.forVotes),
            againstVotes: ethers.utils.formatEther(proposalData.againstVotes),
            abstainVotes: ethers.utils.formatEther(proposalData.abstainVotes),
            startBlock: proposalData.startBlock.toString(),
            endBlock: proposalData.endBlock.toString(),
            ipfsHash: proposalData.ipfsHash || ''
          });
        }

        return res.status(200).json({
          success: true,
          proposals
        });
      }
    } catch (error) {
      console.error('Error retrieving proposals:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve proposals',
        error: error.message
      });
    }
  }

  // Handle PUT requests for casting votes
  else if (req.method === 'PUT') {
    try {
      const {
        proposalId,
        voterAddress,
        voteType, // 0 = Against, 1 = For, 2 = Abstain
        reason,
        networkId,
        signature
      } = req.body;

      // Validate required fields
      if (!proposalId || !voterAddress || voteType === undefined || !networkId || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const message = JSON.stringify({
        action: 'cast-vote',
        proposalId,
        voteType,
        voterAddress,
        timestamp: Math.floor(Date.now() / 1000)
      });

      const isValidSignature = await verifySignature(voterAddress, message, signature);

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Initialize provider and contract
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

      // Check if voter has voting power
      const synToken = new ethers.Contract(
        NETWORK_CONFIG[networkId].synTokenAddress,
        SYNTokenABI,
        provider
      );

      const voterPower = await synToken.getVotingPower(voterAddress);

      if (voterPower.eq(ethers.BigNumber.from(0))) {
        return res.status(403).json({
          success: false,
          message: 'No voting power'
        });
      }

      // Use server-side signer for the transaction
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const governance = new ethers.Contract(
        NETWORK_CONFIG[networkId].governanceAddress,
        GovernanceABI,
        signer
      );

      // Cast vote on blockchain
      let tx;
      if (reason) {
        tx = await governance.castVoteWithReason(proposalId, voteType, reason);
      } else {
        tx = await governance.castVote(proposalId, voteType);
      }
      const receipt = await tx.wait();

      // Get updated vote counts
      const proposalData = await governance.getProposal(proposalId);

      return res.status(200).json({
        success: true,
        message: 'Vote cast successfully',
        proposalId,
        voter: voterAddress,
        voteType: ['Against', 'For', 'Abstain'][voteType],
        reason: reason || '',
        votingPower: ethers.utils.formatEther(voterPower),
        forVotes: ethers.utils.formatEther(proposalData.forVotes),
        againstVotes: ethers.utils.formatEther(proposalData.againstVotes),
        abstainVotes: ethers.utils.formatEther(proposalData.abstainVotes),
        transactionHash: receipt.transactionHash
      });
    } catch (error) {
      console.error('Error casting vote:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to cast vote',
        error: error.message
      });
    }
  }

  // Handle PATCH requests for executing proposals
  else if (req.method === 'PATCH') {
    try {
      const {
        proposalId,
        executorAddress,
        networkId,
        signature
      } = req.body;

      // Validate required fields
      if (!proposalId || !executorAddress || !networkId || !signature) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the request
      const message = JSON.stringify({
        action: 'execute-proposal',
        proposalId,
        executorAddress,
        timestamp: Math.floor(Date.now() / 1000)
      });

      const isValidSignature = await verifySignature(executorAddress, message, signature);

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Initialize provider and contract
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const governance = new ethers.Contract(
        NETWORK_CONFIG[networkId].governanceAddress,
        GovernanceABI,
        provider
      );

      // Check if proposal is in executable state
      const proposalState = await governance.state(proposalId);

      if (proposalState !== 4) { // Assuming state 4 is "Succeeded"
        return res.status(400).json({
          success: false,
          message: `Proposal not in executable state. Current state: ${formatProposalState(proposalState)}`
        });
      }

      // Get proposal details
      const proposalData = await governance.getProposal(proposalId);

      // Use server-side signer for the transaction
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const governanceWithSigner = governance.connect(signer);

      // Execute proposal on blockchain
      const tx = await governanceWithSigner.execute(
        proposalData.targets,
        proposalData.values,
        proposalData.calldatas,
        ethers.utils.keccak256(ethers.utils.toUtf8Bytes(proposalData.description))
      );
      const receipt = await tx.wait();

      return res.status(200).json({
        success: true,
        message: 'Proposal executed successfully',
        proposalId,
        executor: executorAddress,
        transactionHash: receipt.transactionHash
      });
    } catch (error) {
      console.error('Error executing proposal:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to execute proposal',
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
 * Extract proposal ID from transaction receipt
 * @param {object} receipt - Transaction receipt
 * @returns {string} - Proposal ID
 */
function extractProposalId(receipt) {
  // Find the ProposalCreated event
  const event = receipt.events.find(e => e.event === 'ProposalCreated');

  if (!event) {
    throw new Error('ProposalCreated event not found in transaction receipt');
  }

  // Extract proposalId from event args
  return event.args.proposalId.toString();
}

/**
 * Format proposal state to human-readable status
 * @param {number} state - Numeric state from contract
 * @returns {string} - Human-readable status
 */
function formatProposalState(state) {
  const states = [
    'Pending',
    'Active',
    'Canceled',
    'Defeated',
    'Succeeded',
    'Queued',
    'Expired',
    'Executed'
  ];

  return states[state] || 'Unknown';
}

/**
 * Extract title from proposal description
 * @param {string} description - Proposal description
 * @returns {string} - Extracted title
 */
function extractTitleFromDescription(description) {
  // If description contains IPFS hash, extract the title part
  if (description.includes(' - IPFS: ')) {
    return description.split(' - IPFS: ')[0];
  }

  // Otherwise use first line or truncate
  const firstLine = description.split('\n')[0];
  return firstLine.length > 100 ? firstLine.substring(0, 97) + '...' : firstLine;
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
