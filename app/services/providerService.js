/**
 * Provider Service
 * Service for managing blockchain providers and contract interactions
 */

import { ethers } from 'ethers';
import { SUPPORTED_NETWORKS, DEFAULT_NETWORK_ID } from '../blockchain/networks';

// Contract ABIs
import DataVaultABI from '../blockchain/contracts/DataVault.json';
import ComputeManagerABI from '../blockchain/contracts/ComputeManager.json';
import SYNTokenABI from '../blockchain/contracts/SYNToken.json';
import AIPTokenABI from '../blockchain/contracts/AIPToken.json';

// Contract addresses by network
const CONTRACT_ADDRESSES = {
  // Ethereum Mainnet
  1: {
    dataVault: '0x...',  // Replace with actual deployment address
    computeManager: '0x...',  // Replace with actual deployment address
    synToken: '0x...',  // Replace with actual deployment address
    aipToken: '0x...'  // Replace with actual deployment address
  },
  // Polygon Mainnet
  137: {
    dataVault: '0x...',
    computeManager: '0x...',
    synToken: '0x...',
    aipToken: '0x...'
  },
  // Goerli Testnet
  5: {
    dataVault: '0x123456789abcdef123456789abcdef123456789a',
    computeManager: '0xabcdef123456789abcdef123456789abcdef1234',
    synToken: '0x9876543210abcdef9876543210abcdef98765432',
    aipToken: '0xfedcba9876543210fedcba9876543210fedcba98'
  },
  // Sepolia Testnet
  11155111: {
    dataVault: '0x321456789abcdef123456789abcdef123456789a',
    computeManager: '0xbeadef123456789abcdef123456789abcdef1234',
    synToken: '0x1276543210abcdef9876543210abcdef98765432',
    aipToken: '0xfaacba9876543210fedcba9876543210fedcba98'
  },
  // Mumbai Testnet
  80001: {
    dataVault: '0x789456789abcdef123456789abcdef123456789a',
    computeManager: '0xeffdef123456789abcdef123456789abcdef1234',
    synToken: '0x3456543210abcdef9876543210abcdef98765432',
    aipToken: '0xfedefa9876543210fedcba9876543210fedcba98'
  }
};

/**
 * Class for managing blockchain providers and contract interactions
 */
class ProviderService {
  constructor() {
    // Initialize with default provider
    this.defaultProvider = this._createReadProvider(DEFAULT_NETWORK_ID);
    this.networkId = DEFAULT_NETWORK_ID;
    this.providers = {};
    this.contracts = {};
  }

  /**
   * Create a read-only provider for a specific network
   * @param {number} networkId - The network ID to create provider for
   * @returns {ethers.providers.JsonRpcProvider} The created provider
   * @private
   */
  _createReadProvider(networkId) {
    const network = SUPPORTED_NETWORKS[networkId];
    if (!network) {
      throw new Error(`Unsupported network ID: ${networkId}`);
    }

    // Create and return a JSON RPC provider
    const rpcUrl = network.rpcUrl.replace('${INFURA_API_KEY}', process.env.NEXT_PUBLIC_INFURA_API_KEY || '');
    return new ethers.providers.JsonRpcProvider(rpcUrl);
  }

  /**
   * Get a provider for a specific network
   * @param {number} networkId - The network ID to get provider for
   * @returns {ethers.providers.JsonRpcProvider} The provider for the specified network
   */
  getProvider(networkId = DEFAULT_NETWORK_ID) {
    // Return from cache if exists
    if (this.providers[networkId]) {
      return this.providers[networkId];
    }

    // Create new provider, cache and return
    const provider = this._createReadProvider(networkId);
    this.providers[networkId] = provider;
    return provider;
  }

  /**
   * Set current network ID
   * @param {number} networkId - The network ID to set
   */
  setNetworkId(networkId) {
    this.networkId = networkId;
    // Create provider for this network if not exists
    if (!this.providers[networkId]) {
      this.providers[networkId] = this._createReadProvider(networkId);
    }
  }

  /**
   * Get contract addresses for a specific network
   * @param {number} networkId - The network ID
   * @returns {Object|null} Contract addresses object or null if not found
   */
  getContractAddresses(networkId = this.networkId) {
    return CONTRACT_ADDRESSES[networkId] || null;
  }

  /**
   * Get a contract instance
   * @param {string} contractName - Name of the contract (dataVault, computeManager, synToken, aipToken)
   * @param {number} networkId - Network ID to use (defaults to current)
   * @param {ethers.Signer} [signer] - Optional signer for write operations
   * @returns {ethers.Contract} The contract instance
   */
  getContract(contractName, networkId = this.networkId, signer = null) {
    const cacheKey = `${contractName}-${networkId}-${signer ? 'signed' : 'readonly'}`;

    // Return from cache if exists
    if (this.contracts[cacheKey]) {
      return this.contracts[cacheKey];
    }

    // Get contract addresses for this network
    const addresses = this.getContractAddresses(networkId);
    if (!addresses) {
      throw new Error(`No contract addresses found for network ID: ${networkId}`);
    }

    // Get contract address
    const address = addresses[contractName];
    if (!address) {
      throw new Error(`No address found for contract: ${contractName}`);
    }

    // Get contract ABI
    let abi;
    switch (contractName) {
      case 'dataVault':
        abi = DataVaultABI;
        break;
      case 'computeManager':
        abi = ComputeManagerABI;
        break;
      case 'synToken':
        abi = SYNTokenABI;
        break;
      case 'aipToken':
        abi = AIPTokenABI;
        break;
      default:
        throw new Error(`Unknown contract name: ${contractName}`);
    }

    // Get provider
    const provider = this.getProvider(networkId);

    // Create contract instance
    const contract = new ethers.Contract(
      address,
      abi,
      signer || provider
    );

    // Cache contract
    this.contracts[cacheKey] = contract;
    return contract;
  }

  /**
   * Get DataVault contract
   * @param {number} networkId - Network ID
   * @param {ethers.Signer} [signer] - Optional signer
   * @returns {ethers.Contract} DataVault contract
   */
  getDataVaultContract(networkId = this.networkId, signer = null) {
    return this.getContract('dataVault', networkId, signer);
  }

  /**
   * Get ComputeManager contract
   * @param {number} networkId - Network ID
   * @param {ethers.Signer} [signer] - Optional signer
   * @returns {ethers.Contract} ComputeManager contract
   */
  getComputeManagerContract(networkId = this.networkId, signer = null) {
    return this.getContract('computeManager', networkId, signer);
  }

  /**
   * Get SYN Token contract
   * @param {number} networkId - Network ID
   * @param {ethers.Signer} [signer] - Optional signer
   * @returns {ethers.Contract} SYN Token contract
   */
  getSYNTokenContract(networkId = this.networkId, signer = null) {
    return this.getContract('synToken', networkId, signer);
  }

  /**
   * Get AIP Token contract
   * @param {number} networkId - Network ID
   * @param {ethers.Signer} [signer] - Optional signer
   * @returns {ethers.Contract} AIP Token contract
   */
  getAIPTokenContract(networkId = this.networkId, signer = null) {
    return this.getContract('aipToken', networkId, signer);
  }
}

// Create and export singleton instance
const providerService = new ProviderService();
export default providerService;
