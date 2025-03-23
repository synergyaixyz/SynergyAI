/**
 * Tokens contract interface
 * Handles interactions with SYN and AIP token contracts
 */

import { ethers } from 'ethers';

// Token ABIs
const SYN_TOKEN_ABI = [
  // Standard ERC20 functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  // Staking related functions
  'function stake(uint256 amount) returns (bool)',
  'function unstake(uint256 amount) returns (bool)',
  'function getStakedAmount(address account) view returns (uint256)',
  'function getRewardRate() view returns (uint256)',
  'function getRewards(address account) view returns (uint256)',
  'function claimRewards() returns (uint256)'
];

const AIP_TOKEN_ABI = [
  // Standard ERC20 functions
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function transfer(address recipient, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function transferFrom(address sender, address recipient, uint256 amount) returns (bool)',
  // Events
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)',
  // AIP specific functions
  'function mint(address to, uint256 amount) returns (bool)',
  'function burn(uint256 amount) returns (bool)',
  'function burnFrom(address account, uint256 amount) returns (bool)'
];

// Contract addresses by network ID
export const TOKEN_ADDRESSES = {
  // Ethereum Mainnet
  '1': {
    SYN: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    AIP: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
  },
  // Polygon Mainnet
  '137': {
    SYN: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    AIP: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
  },
  // Goerli Testnet
  '5': {
    SYN: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    AIP: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
  },
  // Sepolia Testnet
  '11155111': {
    SYN: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    AIP: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
  },
  // Mumbai Testnet (Polygon)
  '80001': {
    SYN: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
    AIP: '0x0000000000000000000000000000000000000000', // Replace with actual address when deployed
  }
};

/**
 * Get the address of a token on the specified network
 * @param {string} tokenSymbol - The token symbol (SYN or AIP)
 * @param {string} networkId - The network ID
 * @returns {string} The token address
 */
export function getTokenAddress(tokenSymbol, networkId) {
  if (!TOKEN_ADDRESSES[networkId]) {
    throw new Error(`Unsupported network ID: ${networkId}`);
  }
  
  if (!TOKEN_ADDRESSES[networkId][tokenSymbol]) {
    throw new Error(`Unsupported token: ${tokenSymbol} on network ${networkId}`);
  }
  
  return TOKEN_ADDRESSES[networkId][tokenSymbol];
}

/**
 * Create a contract instance for interacting with the tokens
 * @param {string} tokenSymbol - The token symbol (SYN or AIP)
 * @param {Object} provider - Ethers provider
 * @param {string} networkId - The network ID
 * @param {Object} signer - Optional signer for transactions
 * @returns {Contract} Ethers contract instance
 */
export function createTokenContract(tokenSymbol, provider, networkId, signer = null) {
  const address = getTokenAddress(tokenSymbol, networkId);
  const abi = tokenSymbol === 'SYN' ? SYN_TOKEN_ABI : AIP_TOKEN_ABI;
  
  return new ethers.Contract(
    address,
    abi,
    signer || provider
  );
}

/**
 * Get the balance of a token for an account
 * @param {string} tokenSymbol - The token symbol (SYN or AIP)
 * @param {string} account - The account address
 * @param {Object} provider - Ethers provider
 * @param {string} networkId - The network ID
 * @returns {Promise<BigNumber>} The balance as a BigNumber
 */
export async function getTokenBalance(tokenSymbol, account, provider, networkId) {
  const contract = createTokenContract(tokenSymbol, provider, networkId);
  return contract.balanceOf(account);
}

/**
 * Get staked amount for an account (only for SYN token)
 * @param {string} account - The account address
 * @param {Object} provider - Ethers provider
 * @param {string} networkId - The network ID
 * @returns {Promise<BigNumber>} The staked amount as a BigNumber
 */
export async function getStakedAmount(account, provider, networkId) {
  const contract = createTokenContract('SYN', provider, networkId);
  return contract.getStakedAmount(account);
}

/**
 * Stake SYN tokens
 * @param {string} amount - The amount to stake
 * @param {Object} signer - Ethers signer
 * @param {string} networkId - The network ID
 * @returns {Promise<TransactionResponse>} The transaction
 */
export async function stakeTokens(amount, signer, networkId) {
  const contract = createTokenContract('SYN', null, networkId, signer);
  return contract.stake(amount);
}

/**
 * Unstake SYN tokens
 * @param {string} amount - The amount to unstake
 * @param {Object} signer - Ethers signer
 * @param {string} networkId - The network ID
 * @returns {Promise<TransactionResponse>} The transaction
 */
export async function unstakeTokens(amount, signer, networkId) {
  const contract = createTokenContract('SYN', null, networkId, signer);
  return contract.unstake(amount);
}

/**
 * Get available rewards for an account
 * @param {string} account - The account address
 * @param {Object} provider - Ethers provider
 * @param {string} networkId - The network ID
 * @returns {Promise<BigNumber>} The rewards amount as a BigNumber
 */
export async function getRewards(account, provider, networkId) {
  const contract = createTokenContract('SYN', provider, networkId);
  return contract.getRewards(account);
}

/**
 * Claim staking rewards
 * @param {Object} signer - Ethers signer
 * @param {string} networkId - The network ID
 * @returns {Promise<TransactionResponse>} The transaction
 */
export async function claimRewards(signer, networkId) {
  const contract = createTokenContract('SYN', null, networkId, signer);
  return contract.claimRewards();
}

/**
 * Transfer tokens to another address
 * @param {string} tokenSymbol - The token symbol (SYN or AIP)
 * @param {string} recipient - The recipient address
 * @param {string} amount - The amount to transfer
 * @param {Object} signer - Ethers signer
 * @param {string} networkId - The network ID
 * @returns {Promise<TransactionResponse>} The transaction
 */
export async function transferTokens(tokenSymbol, recipient, amount, signer, networkId) {
  const contract = createTokenContract(tokenSymbol, null, networkId, signer);
  return contract.transfer(recipient, amount);
}

/**
 * Approve tokens for spending by another address
 * @param {string} tokenSymbol - The token symbol (SYN or AIP)
 * @param {string} spender - The spender address
 * @param {string} amount - The amount to approve
 * @param {Object} signer - Ethers signer
 * @param {string} networkId - The network ID
 * @returns {Promise<TransactionResponse>} The transaction
 */
export async function approveTokens(tokenSymbol, spender, amount, signer, networkId) {
  const contract = createTokenContract(tokenSymbol, null, networkId, signer);
  return contract.approve(spender, amount);
} 