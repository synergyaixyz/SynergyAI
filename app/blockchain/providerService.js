/**
 * Provider Service
 *
 * Manages blockchain providers and contract interactions
 */

import { ethers } from 'ethers';
import { NETWORK_CONFIG, isNetworkSupported } from './networks';

class ProviderService {
  constructor() {
    this.providers = {};
    this.network = null;
    this.account = null;
    this.signer = null;
    this.web3Provider = null;
    this.networkListeners = [];
    this.accountListeners = [];
  }

  /**
   * Initialize provider service
   */
  async init() {
    // Check if ethereum provider exists
    if (window.ethereum) {
      this.web3Provider = new ethers.providers.Web3Provider(window.ethereum);

      // Listen for network changes
      window.ethereum.on('chainChanged', (chainIdHex) => {
        const chainId = parseInt(chainIdHex, 16);
        this.handleNetworkChange(chainId);
      });

      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts) => {
        this.handleAccountChange(accounts[0] || null);
      });

      // Get current network and account
      await this.refreshNetworkAndAccount();
    }
  }

  /**
   * Refresh current network and account information
   */
  async refreshNetworkAndAccount() {
    try {
      // Get network information
      const network = await this.web3Provider.getNetwork();
      this.handleNetworkChange(network.chainId);

      // Get account information
      const accounts = await this.web3Provider.listAccounts();
      this.handleAccountChange(accounts[0] || null);
    } catch (error) {
      console.error('Error refreshing network and account information:', error);
    }
  }

  /**
   * Handle network changes
   * @param {number} chainId - Chain ID
   */
  handleNetworkChange(chainId) {
    this.network = chainId;
    this.notifyNetworkListeners(chainId);
  }

  /**
   * Handle account changes
   * @param {string|null} account - Account address
   */
  handleAccountChange(account) {
    this.account = account;
    if (account && this.web3Provider) {
      this.signer = this.web3Provider.getSigner();
    } else {
      this.signer = null;
    }
    this.notifyAccountListeners(account);
  }

  /**
   * Get provider for a specific network
   * @param {number} networkId - Network ID
   * @returns {ethers.providers.Provider} Network provider
   */
  getProvider(networkId) {
    // If connected and network ID matches current network, return web3Provider
    if (this.web3Provider && this.network === networkId) {
      return this.web3Provider;
    }

    // Cache provider for unconnected networks
    if (!this.providers[networkId]) {
      const networkConfig = NETWORK_CONFIG[networkId];
      if (!networkConfig) {
        throw new Error(`Unsupported network ID: ${networkId}`);
      }
      this.providers[networkId] = new ethers.providers.JsonRpcProvider(networkConfig.rpcUrl);
    }

    return this.providers[networkId];
  }

  /**
   * Get current signer
   * @returns {ethers.Signer|null} Signer instance or null
   */
  getSigner() {
    return this.signer;
  }

  /**
   * Get current connected account
   * @returns {string|null} Account address or null
   */
  getAccount() {
    return this.account;
  }

  /**
   * Get current network ID
   * @returns {number|null} Network ID or null
   */
  getNetwork() {
    return this.network;
  }

  /**
   * Check if current network is supported
   * @returns {boolean} Whether current network is supported
   */
  isCurrentNetworkSupported() {
    return isNetworkSupported(this.network);
  }

  /**
   * Request user to connect wallet
   * @returns {Promise<string|null>} Connected account address or null
   */
  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed or unavailable');
    }

    try {
      // Request user authorization to connect
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      return accounts[0] || null;
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  }

  /**
   * Request network switch
   * @param {number} networkId - Target network ID
   * @returns {Promise<boolean>} Whether switch was successful
   */
  async switchNetwork(networkId) {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed or unavailable');
    }

    const networkConfig = NETWORK_CONFIG[networkId];
    if (!networkConfig) {
      throw new Error(`Unsupported network ID: ${networkId}`);
    }

    const chainIdHex = `0x${networkId.toString(16)}`;

    try {
      // Try to switch to specified network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }]
      });
      return true;
    } catch (error) {
      // If network is not added to MetaMask, try to add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: chainIdHex,
                chainName: networkConfig.name,
                nativeCurrency: {
                  name: networkConfig.currencySymbol,
                  symbol: networkConfig.currencySymbol,
                  decimals: 18
                },
                rpcUrls: [networkConfig.rpcUrl],
                blockExplorerUrls: [networkConfig.explorerUrl]
              }
            ]
          });
          return true;
        } catch (addError) {
          console.error('Failed to add network to wallet:', addError);
          return false;
        }
      } else {
        console.error('Failed to switch network:', error);
        return false;
      }
    }
  }

  /**
   * Add network change listener
   * @param {Function} listener - Network change listener function
   * @returns {Function} Function to remove the listener
   */
  addNetworkListener(listener) {
    this.networkListeners.push(listener);
    // Immediately notify of current network
    if (this.network !== null) {
      listener(this.network);
    }

    // Return function to remove the listener
    return () => {
      this.networkListeners = this.networkListeners.filter(l => l !== listener);
    };
  }

  /**
   * Add account change listener
   * @param {Function} listener - Account change listener function
   * @returns {Function} Function to remove the listener
   */
  addAccountListener(listener) {
    this.accountListeners.push(listener);
    // Immediately notify of current account
    if (this.account !== undefined) {
      listener(this.account);
    }

    // Return function to remove the listener
    return () => {
      this.accountListeners = this.accountListeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all network listeners
   * @param {number} networkId - Network ID
   */
  notifyNetworkListeners(networkId) {
    this.networkListeners.forEach(listener => listener(networkId));
  }

  /**
   * Notify all account listeners
   * @param {string|null} account - Account address
   */
  notifyAccountListeners(account) {
    this.accountListeners.forEach(listener => listener(account));
  }

  /**
   * Get transaction explorer URL
   * @param {string} txHash - Transaction hash
   * @returns {string} Transaction explorer URL
   */
  getTransactionExplorerUrl(txHash) {
    if (!this.network) return '#';
    const networkConfig = NETWORK_CONFIG[this.network];
    if (!networkConfig) return '#';
    return `${networkConfig.explorerUrl}/tx/${txHash}`;
  }

  /**
   * Get address explorer URL
   * @param {string} address - Ethereum address
   * @returns {string} Address explorer URL
   */
  getAddressExplorerUrl(address) {
    if (!this.network) return '#';
    const networkConfig = NETWORK_CONFIG[this.network];
    if (!networkConfig) return '#';
    return `${networkConfig.explorerUrl}/address/${address}`;
  }
}

// Create singleton instance
const providerService = new ProviderService();

export default providerService;
