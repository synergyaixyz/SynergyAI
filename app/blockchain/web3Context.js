import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { 
  NETWORK_IDS, 
  DEFAULT_NETWORK, 
  isNetworkSupported, 
  getNetworkDetails,
  getSwitchNetworkParams 
} from './networkConfig';

// Create Context
const Web3Context = createContext();

// Provider Component
export const Web3Provider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isNetworkValid, setIsNetworkValid] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize provider
  useEffect(() => {
    const initProvider = async () => {
      try {
        if (window.ethereum) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          setProvider(provider);
          
          // Listen for network changes
          window.ethereum.on('chainChanged', (chainIdHex) => {
            const networkId = parseInt(chainIdHex, 16);
            checkNetwork(networkId);
            window.location.reload();
          });
          
          // Listen for account changes
          window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length > 0) {
              setAccount(accounts[0]);
            } else {
              setAccount(null);
              setSigner(null);
              setIsConnected(false);
            }
          });
          
          // Get network information
          const network = await provider.getNetwork();
          const networkId = parseInt(network.chainId);
          setNetwork(network);
          checkNetwork(networkId);
          
          // Check if already connected
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0]);
            const signer = await provider.getSigner();
            setSigner(signer);
            setIsConnected(true);
          }
        } else {
          setError('Ethereum wallet not detected. Please install MetaMask or another compatible wallet.');
        }
      } catch (error) {
        console.error('Web3 initialization error:', error);
        setError('Error connecting to Web3 provider');
      }
    };

    if (typeof window !== 'undefined') {
      initProvider();
    }
    
    // Cleanup on unmount
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('chainChanged', () => {});
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  
  // Check if connected network is supported
  const checkNetwork = (networkId) => {
    const valid = isNetworkSupported(networkId);
    setIsNetworkValid(valid);
    if (!valid) {
      setError(`Network not supported. Please connect to ${getNetworkDetails(DEFAULT_NETWORK).name}`);
    } else {
      setError(null);
    }
  };

  // Switch network
  const switchNetwork = async (targetNetworkId) => {
    if (!window.ethereum) {
      setError('Ethereum wallet not detected');
      return false;
    }
    
    setIsLoading(true);
    try {
      const params = getSwitchNetworkParams(targetNetworkId);
      await window.ethereum.request(params);
      return true;
    } catch (error) {
      console.error('Failed to switch network:', error);
      setError(`Failed to switch network: ${error.message}`);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Connect wallet function
  const connectWallet = async () => {
    if (!provider) {
      setError('Web3 provider not initialized');
      return;
    }
    
    setIsLoading(true);
    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        const signer = await provider.getSigner();
        setSigner(signer);
        setIsConnected(true);
        
        // Check if we need to switch network
        const network = await provider.getNetwork();
        const networkId = parseInt(network.chainId);
        
        if (!isNetworkSupported(networkId)) {
          const switched = await switchNetwork(DEFAULT_NETWORK);
          if (!switched) {
            setError(`Please switch to a supported network (${getNetworkDetails(DEFAULT_NETWORK).name})`);
          }
        } else {
          setError(null);
        }
      } else {
        setError('No accounts found, please make sure your wallet is unlocked');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      // Handle specific error codes
      if (error.code === 4001) {
        setError('Connection rejected. Please approve the connection request.');
      } else {
        setError(`Error connecting wallet: ${error.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setIsConnected(false);
  };

  // Get balance
  const getBalance = async (address) => {
    try {
      const targetAddress = address || account;
      if (!targetAddress) return null;
      
      const balance = await provider.getBalance(targetAddress);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      return null;
    }
  };

  // Context value
  const contextValue = {
    provider,
    signer,
    account,
    network,
    isConnected,
    isNetworkValid,
    isLoading,
    error,
    connectWallet,
    disconnectWallet,
    getBalance,
    switchNetwork
  };

  return (
    <Web3Context.Provider value={contextValue}>
      {children}
    </Web3Context.Provider>
  );
};

// Custom hook to use the Web3 context
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used inside a Web3Provider');
  }
  return context;
}; 