/**
 * DataVault contract interface
 * Provides functionalities to manage data access control, encryption keys,
 * and data ownership on the blockchain
 */

import { ethers } from 'ethers';
import { getContractAddress } from '../contractHelpers';
import DataVaultABI from './DataVault.json';
import { SUPPORTED_NETWORKS } from '../networkConfig';

// Contract addresses by network ID
const CONTRACT_ADDRESSES = {
  // Ethereum Mainnet
  1: '0x0000000000000000000000000000000000000000', // Placeholder - replace with actual address

  // Polygon Mainnet
  137: '0x0000000000000000000000000000000000000000', // Placeholder - replace with actual address

  // Goerli Testnet
  5: '0x0000000000000000000000000000000000000000', // Placeholder - replace with actual address

  // Sepolia Testnet
  11155111: '0x0000000000000000000000000000000000000000', // Placeholder - replace with actual address

  // Mumbai Testnet
  80001: '0x0000000000000000000000000000000000000000', // Placeholder - replace with actual address
};

/**
 * Get the DataVault contract address for the specified network
 * @param {number} networkId - The network ID
 * @returns {string} The contract address for the network
 */
export const getDataVaultAddress = (networkId) => {
  return getContractAddress(CONTRACT_ADDRESSES, networkId, 'DataVault');
};

/**
 * Create a DataVault contract instance
 * @param {ethers.providers.Provider|ethers.Signer} providerOrSigner - Provider or signer to use
 * @param {number} networkId - The network ID
 * @returns {ethers.Contract} The DataVault contract instance
 */
export const createDataVaultContract = (providerOrSigner, networkId) => {
  const contractAddress = getDataVaultAddress(networkId);
  return new ethers.Contract(contractAddress, DataVaultABI.abi, providerOrSigner);
};

/**
 * Register a new dataset on the DataVault contract
 * @param {ethers.Signer} signer - The signer to use for the transaction
 * @param {number} networkId - The network ID
 * @param {string} dataId - Unique identifier for the dataset (usually IPFS CID)
 * @param {string} encryptedMetadata - Encrypted metadata about the dataset
 * @param {string} accessControlList - JSON string of addresses with access permissions
 * @returns {Promise<ethers.providers.TransactionReceipt>} Transaction receipt
 */
export const registerDataset = async (signer, networkId, dataId, encryptedMetadata, accessControlList) => {
  try {
    const contract = createDataVaultContract(signer, networkId);
    const tx = await contract.registerDataset(dataId, encryptedMetadata, accessControlList);
    return await tx.wait();
  } catch (error) {
    console.error('Error registering dataset:', error);
    throw error;
  }
};

/**
 * Update the access control list for a dataset
 * @param {ethers.Signer} signer - The signer to use for the transaction
 * @param {number} networkId - The network ID
 * @param {string} dataId - Unique identifier for the dataset
 * @param {string} newAccessControlList - Updated JSON string of addresses with access permissions
 * @returns {Promise<ethers.providers.TransactionReceipt>} Transaction receipt
 */
export const updateAccessControl = async (signer, networkId, dataId, newAccessControlList) => {
  try {
    const contract = createDataVaultContract(signer, networkId);
    const tx = await contract.updateAccessControl(dataId, newAccessControlList);
    return await tx.wait();
  } catch (error) {
    console.error('Error updating access control:', error);
    throw error;
  }
};

/**
 * Grant access to a specific address for a dataset
 * @param {ethers.Signer} signer - The signer to use for the transaction
 * @param {number} networkId - The network ID
 * @param {string} dataId - Unique identifier for the dataset
 * @param {string} userAddress - Address to grant access to
 * @param {number} accessLevel - Level of access (1: read, 2: modify, 3: admin)
 * @returns {Promise<ethers.providers.TransactionReceipt>} Transaction receipt
 */
export const grantAccess = async (signer, networkId, dataId, userAddress, accessLevel) => {
  try {
    const contract = createDataVaultContract(signer, networkId);
    const tx = await contract.grantAccess(dataId, userAddress, accessLevel);
    return await tx.wait();
  } catch (error) {
    console.error('Error granting access:', error);
    throw error;
  }
};

/**
 * Revoke access from a specific address for a dataset
 * @param {ethers.Signer} signer - The signer to use for the transaction
 * @param {number} networkId - The network ID
 * @param {string} dataId - Unique identifier for the dataset
 * @param {string} userAddress - Address to revoke access from
 * @returns {Promise<ethers.providers.TransactionReceipt>} Transaction receipt
 */
export const revokeAccess = async (signer, networkId, dataId, userAddress) => {
  try {
    const contract = createDataVaultContract(signer, networkId);
    const tx = await contract.revokeAccess(dataId, userAddress);
    return await tx.wait();
  } catch (error) {
    console.error('Error revoking access:', error);
    throw error;
  }
};

/**
 * Check if an address has access to a dataset
 * @param {ethers.providers.Provider|ethers.Signer} providerOrSigner - Provider or signer to use
 * @param {number} networkId - The network ID
 * @param {string} dataId - Unique identifier for the dataset
 * @param {string} userAddress - Address to check access for
 * @returns {Promise<number>} Access level (0: no access, 1: read, 2: modify, 3: admin)
 */
export const checkAccess = async (providerOrSigner, networkId, dataId, userAddress) => {
  try {
    const contract = createDataVaultContract(providerOrSigner, networkId);
    return await contract.checkAccess(dataId, userAddress);
  } catch (error) {
    console.error('Error checking access:', error);
    throw error;
  }
};

/**
 * Get the encryption key for a dataset (only accessible by authorized addresses)
 * @param {ethers.Signer} signer - The signer to use for the transaction
 * @param {number} networkId - The network ID
 * @param {string} dataId - Unique identifier for the dataset
 * @returns {Promise<string>} Encrypted key that can be decrypted by the caller
 */
export const getEncryptionKey = async (signer, networkId, dataId) => {
  try {
    const contract = createDataVaultContract(signer, networkId);
    return await contract.getEncryptionKey(dataId);
  } catch (error) {
    console.error('Error getting encryption key:', error);
    throw error;
  }
};

/**
 * Update the encryption key for a dataset (only by owner)
 * @param {ethers.Signer} signer - The signer to use for the transaction
 * @param {number} networkId - The network ID
 * @param {string} dataId - Unique identifier for the dataset
 * @param {string} newEncryptedKey - New encrypted key
 * @returns {Promise<ethers.providers.TransactionReceipt>} Transaction receipt
 */
export const updateEncryptionKey = async (signer, networkId, dataId, newEncryptedKey) => {
  try {
    const contract = createDataVaultContract(signer, networkId);
    const tx = await contract.updateEncryptionKey(dataId, newEncryptedKey);
    return await tx.wait();
  } catch (error) {
    console.error('Error updating encryption key:', error);
    throw error;
  }
};

/**
 * Get all datasets owned by an address
 * @param {ethers.providers.Provider|ethers.Signer} providerOrSigner - Provider or signer to use
 * @param {number} networkId - The network ID
 * @param {string} ownerAddress - Address of the owner
 * @returns {Promise<Array<string>>} Array of dataset IDs
 */
export const getDatasetsByOwner = async (providerOrSigner, networkId, ownerAddress) => {
  try {
    const contract = createDataVaultContract(providerOrSigner, networkId);
    return await contract.getDatasetsByOwner(ownerAddress);
  } catch (error) {
    console.error('Error getting datasets by owner:', error);
    throw error;
  }
};

/**
 * Get all datasets a user has access to
 * @param {ethers.providers.Provider|ethers.Signer} providerOrSigner - Provider or signer to use
 * @param {number} networkId - The network ID
 * @param {string} userAddress - Address of the user
 * @returns {Promise<Array<string>>} Array of dataset IDs
 */
export const getAccessibleDatasets = async (providerOrSigner, networkId, userAddress) => {
  try {
    const contract = createDataVaultContract(providerOrSigner, networkId);
    return await contract.getAccessibleDatasets(userAddress);
  } catch (error) {
    console.error('Error getting accessible datasets:', error);
    throw error;
  }
};

/**
 * Get the metadata for a dataset
 * @param {ethers.providers.Provider|ethers.Signer} providerOrSigner - Provider or signer to use
 * @param {number} networkId - The network ID
 * @param {string} dataId - Unique identifier for the dataset
 * @returns {Promise<string>} Encrypted metadata
 */
export const getDatasetMetadata = async (providerOrSigner, networkId, dataId) => {
  try {
    const contract = createDataVaultContract(providerOrSigner, networkId);
    return await contract.getDatasetMetadata(dataId);
  } catch (error) {
    console.error('Error getting dataset metadata:', error);
    throw error;
  }
};

/**
 * Transfer ownership of a dataset
 * @param {ethers.Signer} signer - The signer to use for the transaction
 * @param {number} networkId - The network ID
 * @param {string} dataId - Unique identifier for the dataset
 * @param {string} newOwner - Address of the new owner
 * @returns {Promise<ethers.providers.TransactionReceipt>} Transaction receipt
 */
export const transferOwnership = async (signer, networkId, dataId, newOwner) => {
  try {
    const contract = createDataVaultContract(signer, networkId);
    const tx = await contract.transferOwnership(dataId, newOwner);
    return await tx.wait();
  } catch (error) {
    console.error('Error transferring ownership:', error);
    throw error;
  }
};
