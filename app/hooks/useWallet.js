import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { NETWORK_CONFIG } from '../blockchain/networkConfig';

/**
 * Wallet Connection Hook
 *
 * Provides Ethereum wallet connection and interaction functionality
 * @returns {Object} Wallet state and methods
 */
export function useWallet() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Initialize wallet connection
   */
  const initializeWallet = useCallback(async () => {
    // Clear previous errors
    setError(null);

    // Check if Ethereum wallet exists
    if (!window.ethereum) {
      setError('No Ethereum wallet detected. Please install MetaMask or another compatible wallet.');
      return;
    }

    try {
      const ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      setProvider(ethersProvider);

      // Get network information
      const network = await ethersProvider.getNetwork();
      setChainId(network.chainId);

      // Get connected accounts
      const accounts = await ethersProvider.listAccounts();
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setSigner(ethersProvider.getSigner());
      }
    } catch (err) {
      console.error('Failed to initialize wallet', err);
      setError('Failed to initialize wallet connection. Please try again.');
    }
  }, []);

  /**
   * Connect wallet
   */
  const connectWallet = useCallback(async () => {
    if (!provider) {
      await initializeWallet();
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access permission
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        const ethersProvider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        setAccount(accounts[0]);
        setSigner(ethersProvider.getSigner());
      } else {
        setError('No accounts found. Please connect to MetaMask.');
      }
    } catch (err) {
      console.error('Failed to connect wallet', err);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  }, [provider, initializeWallet]);

  /**
   * Disconnect wallet
   */
  const disconnect = useCallback(() => {
    setAccount(null);
    setSigner(null);
    // Note: There is no standard disconnect method in EIP-1193,
    // so we just clear the local state
  }, []);

  /**
   * Switch network
   * @param {string|number} newChainId - Chain ID to switch to
   */
  const switchNetwork = useCallback(async (newChainId) => {
    if (!window.ethereum) {
      setError('No Ethereum wallet detected.');
      return;
    }

    // Convert to hexadecimal format if not already
    const chainIdHex = typeof newChainId === 'string' && newChainId.startsWith('0x')
      ? newChainId
      : `0x${Number(newChainId).toString(16)}`;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });

      // Chain ID will be updated through the chainChanged event handler
    } catch (err) {
      // This error code indicates that the chain has not been added to MetaMask
      if (err.code === 4902) {
        setError('This network needs to be added to your wallet first.');
      } else {
        console.error('Failed to switch network', err);
        setError('Failed to switch network. Please try again.');
      }
    }
  }, []);

  /**
   * Sign message
   * @param {string} message - Message to sign
   * @returns {Promise<string>} Signed message
   */
  const signMessage = useCallback(async (message) => {
    if (!signer) {
      throw new Error('Wallet not connected');
    }

    try {
      return await signer.signMessage(message);
    } catch (err) {
      console.error('Failed to sign message', err);
      throw new Error('Failed to sign message. Please try again.');
    }
  }, [signer]);

  /**
   * Check if current network is valid
   * @returns {boolean} Whether the network is valid
   */
  const checkValidNetwork = useCallback(() => {
    if (!chainId) return false;

    // Check if current chain ID is in supported networks
    return Object.keys(NETWORK_CONFIG).includes(chainId.toString());
  }, [chainId]);

  // Set up event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected all accounts
        setAccount(null);
        setSigner(null);
      } else {
        // User switched accounts
        setAccount(accounts[0]);
        if (provider) {
          setSigner(provider.getSigner());
        }
      }
    };

    const handleChainChanged = (chainIdHex) => {
      // MetaMask requires page refresh when changing networks
      setChainId(parseInt(chainIdHex, 16));
      // No need to force page reload
      // window.location.reload();
    };

    const handleDisconnect = (error) => {
      // Handle wallet disconnection
      setAccount(null);
      setSigner(null);
      console.log('Wallet disconnected', error);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    // Initialize on mount
    initializeWallet();

    // Clean up event listeners on unmount
    return () => {
      window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum.removeListener('chainChanged', handleChainChanged);
      window.ethereum.removeListener('disconnect', handleDisconnect);
    };
  }, [provider, initializeWallet]);

  // Calculate if connected
  const isConnected = !!account;

  // Calculate if current network is valid
  const isValidNetwork = checkValidNetwork();

  return {
    provider,
    signer,
    account,
    chainId,
    isConnecting,
    error,
    connectWallet,
    disconnect,
    switchNetwork,
    signMessage,
    isConnected,
    isValidNetwork
  };
}

export default useWallet;
