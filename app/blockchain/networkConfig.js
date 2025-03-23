/**
 * Supported blockchain networks configuration
 * Contains network details and deployed contract addresses
 */

// Network IDs
export const NETWORK_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_GOERLI: 5,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001,
  LOCAL: 1337
};

// Network configurations
export const NETWORKS = {
  [NETWORK_IDS.ETHEREUM_MAINNET]: {
    name: 'Ethereum Mainnet',
    currency: 'ETH',
    blockExplorer: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY'
  },
  [NETWORK_IDS.ETHEREUM_GOERLI]: {
    name: 'Goerli Testnet',
    currency: 'ETH',
    blockExplorer: 'https://goerli.etherscan.io',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY'
  },
  [NETWORK_IDS.POLYGON_MAINNET]: {
    name: 'Polygon Mainnet',
    currency: 'MATIC',
    blockExplorer: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com'
  },
  [NETWORK_IDS.POLYGON_MUMBAI]: {
    name: 'Polygon Mumbai',
    currency: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com'
  },
  [NETWORK_IDS.LOCAL]: {
    name: 'Local Development',
    currency: 'ETH',
    blockExplorer: '',
    rpcUrl: 'http://localhost:8545'
  }
};

// Maintain backward compatibility while providing consistent naming
export const NETWORK_CONFIG = NETWORKS;

// Default network for development
export const DEFAULT_NETWORK = NETWORK_IDS.POLYGON_MUMBAI;

/**
 * Contract addresses by network
 * Store deployed contract addresses for each network
 */
export const CONTRACT_ADDRESSES = {
  [NETWORK_IDS.ETHEREUM_MAINNET]: {
    SYNToken: '',
    AIPToken: '',
    DataRegistry: '',
    ComputeManager: ''
  },
  [NETWORK_IDS.ETHEREUM_GOERLI]: {
    SYNToken: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
    AIPToken: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    DataRegistry: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    ComputeManager: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
  },
  [NETWORK_IDS.POLYGON_MUMBAI]: {
    SYNToken: '0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7',
    AIPToken: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    DataRegistry: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    ComputeManager: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'
  },
  [NETWORK_IDS.LOCAL]: {
    SYNToken: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    AIPToken: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
    DataRegistry: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0',
    ComputeManager: '0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9'
  }
};

/**
 * Get contract address by network and contract name
 * @param {number} networkId - The blockchain network ID
 * @param {string} contractName - Name of the contract
 * @returns {string} - Contract address
 */
export const getContractAddress = (networkId, contractName) => {
  // Default to testnet if the network is not supported
  const network = NETWORKS[networkId] ? networkId : DEFAULT_NETWORK;

  return CONTRACT_ADDRESSES[network][contractName];
};

/**
 * Check if the network is supported
 * @param {number} networkId - Network ID to check
 * @returns {boolean} - True if network is supported
 */
export const isNetworkSupported = (networkId) => {
  return Object.keys(NETWORKS).includes(networkId.toString());
};

/**
 * Get network details by ID
 * @param {number} networkId - Network ID
 * @returns {Object} - Network configuration
 */
export const getNetworkDetails = (networkId) => {
  return NETWORKS[networkId] || NETWORKS[DEFAULT_NETWORK];
};

/**
 * Get switch network parameters
 * @param {number} networkId - Target network ID
 * @returns {Object} - Ethereum wallet request parameters
 */
export const getSwitchNetworkParams = (networkId) => {
  const network = NETWORKS[networkId];

  if (!network) {
    throw new Error(`Network ID ${networkId} is not supported`);
  }

  // For Ethereum networks
  if (networkId === NETWORK_IDS.ETHEREUM_MAINNET || networkId === NETWORK_IDS.ETHEREUM_GOERLI) {
    return {
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${networkId.toString(16)}` }]
    };
  }

  // For other networks (need to add the network first)
  return {
    method: 'wallet_addEthereumChain',
    params: [{
      chainId: `0x${networkId.toString(16)}`,
      chainName: network.name,
      nativeCurrency: {
        name: network.currency,
        symbol: network.currency,
        decimals: 18
      },
      rpcUrls: [network.rpcUrl],
      blockExplorerUrls: [network.blockExplorer]
    }]
  };
};
