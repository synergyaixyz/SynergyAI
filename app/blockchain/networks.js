/**
 * Network Configuration
 *
 * Defines supported blockchain networks and contract addresses
 * for SynergyAI's decentralized compute platform.
 */

// Network IDs
export const NETWORK_IDS = {
  ETHEREUM_MAINNET: 1,
  ETHEREUM_GOERLI: 5,
  ETHEREUM_SEPOLIA: 11155111,
  POLYGON_MAINNET: 137,
  POLYGON_MUMBAI: 80001
};

// Network Configuration
export const NETWORK_CONFIG = {
  // Ethereum Mainnet
  [NETWORK_IDS.ETHEREUM_MAINNET]: {
    name: 'Ethereum Mainnet',
    currencySymbol: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    computeManagerAddress: '0x0000000000000000000000000000000000000000', // Placeholder
    tokenAddress: '0x0000000000000000000000000000000000000000', // Placeholder for AIP token
    governorAddress: '0x0000000000000000000000000000000000000000', // Placeholder
    dataRegistryAddress: '0x0000000000000000000000000000000000000000', // Placeholder
    active: false // Set to true when mainnet contracts are deployed
  },

  // Goerli Testnet
  [NETWORK_IDS.ETHEREUM_GOERLI]: {
    name: 'Goerli Testnet',
    currencySymbol: 'GoerliETH',
    explorerUrl: 'https://goerli.etherscan.io',
    rpcUrl: 'https://goerli.infura.io/v3/YOUR_INFURA_KEY',
    computeManagerAddress: '0x1234567890123456789012345678901234567890', // Example testnet address
    tokenAddress: '0x2345678901234567890123456789012345678901', // Example testnet address for AIP token
    governorAddress: '0x3456789012345678901234567890123456789012', // Example testnet address
    dataRegistryAddress: '0x4567890123456789012345678901234567890123', // Example testnet address
    active: true
  },

  // Sepolia Testnet
  [NETWORK_IDS.ETHEREUM_SEPOLIA]: {
    name: 'Sepolia Testnet',
    currencySymbol: 'SepoliaETH',
    explorerUrl: 'https://sepolia.etherscan.io',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    computeManagerAddress: '0x5678901234567890123456789012345678901234', // Example testnet address
    tokenAddress: '0x6789012345678901234567890123456789012345', // Example testnet address for AIP token
    governorAddress: '0x7890123456789012345678901234567890123456', // Example testnet address
    dataRegistryAddress: '0x8901234567890123456789012345678901234567', // Example testnet address
    active: true
  },

  // Polygon Mainnet
  [NETWORK_IDS.POLYGON_MAINNET]: {
    name: 'Polygon Mainnet',
    currencySymbol: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
    rpcUrl: 'https://polygon-rpc.com',
    computeManagerAddress: '0x0000000000000000000000000000000000000000', // Placeholder
    tokenAddress: '0x0000000000000000000000000000000000000000', // Placeholder for AIP token
    governorAddress: '0x0000000000000000000000000000000000000000', // Placeholder
    dataRegistryAddress: '0x0000000000000000000000000000000000000000', // Placeholder
    active: false // Set to true when mainnet contracts are deployed
  },

  // Mumbai Testnet
  [NETWORK_IDS.POLYGON_MUMBAI]: {
    name: 'Mumbai Testnet',
    currencySymbol: 'MATIC',
    explorerUrl: 'https://mumbai.polygonscan.com',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    computeManagerAddress: '0x9012345678901234567890123456789012345678', // Example testnet address
    tokenAddress: '0x0123456789012345678901234567890123456789', // Example testnet address for AIP token
    governorAddress: '0x1234567890123456789012345678901234567891', // Example testnet address
    dataRegistryAddress: '0x2345678901234567890123456789012345678912', // Example testnet address
    active: true
  }
};

// Get list of active networks
export const getActiveNetworks = () => {
  return Object.entries(NETWORK_CONFIG)
    .filter(([, config]) => config.active)
    .map(([id, config]) => ({
      id: parseInt(id),
      name: config.name,
      currencySymbol: config.currencySymbol
    }));
};

// Check if a network is supported
export const isNetworkSupported = (networkId) => {
  return !!(NETWORK_CONFIG[networkId] && NETWORK_CONFIG[networkId].active);
};

export default {
  NETWORK_IDS,
  NETWORK_CONFIG,
  getActiveNetworks,
  isNetworkSupported
};
