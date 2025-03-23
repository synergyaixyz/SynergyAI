/**
 * Data Registry Contract Interface
 *
 * For managing decentralized dataset registration and encryption keys
 */

import { ethers } from 'ethers';
import DataRegistryABI from '../abis/DataRegistryABI.json';
import { NETWORK_CONFIG } from '../networks';
import providerService from '../providerService';

class DataRegistry {
  constructor() {
    this.contracts = {};
  }

  /**
   * Get data registry contract instance
   * @param {number} networkId - Network ID
   * @returns {ethers.Contract} Contract instance
   */
  getContract(networkId) {
    // Check if network ID is valid
    if (!NETWORK_CONFIG[networkId] || !NETWORK_CONFIG[networkId].dataRegistryAddress) {
      throw new Error(`Unsupported network ID: ${networkId} or missing contract address`);
    }

    // If contract is already created, return directly
    if (this.contracts[networkId]) {
      return this.contracts[networkId];
    }

    const contractAddress = NETWORK_CONFIG[networkId].dataRegistryAddress;
    const signer = providerService.getSigner();
    const provider = providerService.getProvider(networkId);

    // Use signer (if available) or provider to create contract instance
    if (signer && providerService.getNetwork() === networkId) {
      this.contracts[networkId] = new ethers.Contract(contractAddress, DataRegistryABI, signer);
    } else {
      this.contracts[networkId] = new ethers.Contract(contractAddress, DataRegistryABI, provider);
    }

    return this.contracts[networkId];
  }

  /**
   * Register new dataset
   * @param {Object} datasetInfo - Dataset information
   * @param {string} datasetInfo.name - Dataset name
   * @param {string} datasetInfo.description - Dataset description
   * @param {string} datasetInfo.dataUri - Dataset URI
   * @param {string} datasetInfo.metadataUri - Metadata URI
   * @param {boolean} datasetInfo.isPublic - Whether it's public
   * @param {string} datasetInfo.encryptedKeyHash - Encrypted key hash
   * @param {number} networkId - Network ID
   * @returns {Promise<Object>} Transaction receipt and dataset ID
   */
  async registerDataset(datasetInfo, networkId) {
    try {
      const contract = this.getContract(networkId);
      const tx = await contract.registerDataset(
        datasetInfo.name,
        datasetInfo.description,
        datasetInfo.dataUri,
        datasetInfo.metadataUri,
        datasetInfo.isPublic,
        datasetInfo.encryptedKeyHash
      );

      const receipt = await tx.wait();

      // Get dataset ID from events
      const event = receipt.events.find(e => e.event === 'DatasetRegistered');
      const datasetId = event.args.datasetId.toString();

      return {
        receipt,
        datasetId
      };
    } catch (error) {
      console.error('Failed to register dataset:', error);
      throw error;
    }
  }

  /**
   * Get datasets owned by a user
   * @param {string} owner - Owner address
   * @param {number} networkId - Network ID
   * @returns {Promise<Array>} Array of dataset IDs
   */
  async getDatasetsByOwner(owner, networkId) {
    try {
      const contract = this.getContract(networkId);
      const datasets = await contract.getDatasetsByOwner(owner);
      return datasets.map(id => id.toString());
    } catch (error) {
      console.error('Failed to get user datasets:', error);
      throw error;
    }
  }

  /**
   * Get dataset information
   * @param {string} datasetId - Dataset ID
   * @param {number} networkId - Network ID
   * @returns {Promise<Object>} Dataset information
   */
  async getDatasetInfo(datasetId, networkId) {
    try {
      const contract = this.getContract(networkId);
      const info = await contract.getDatasetInfo(datasetId);

      return {
        id: datasetId,
        name: info.name,
        description: info.description,
        owner: info.owner,
        dataUri: info.dataUri,
        metadataUri: info.metadataUri,
        isPublic: info.isPublic,
        createdAt: new Date(info.createdAt.toNumber() * 1000),
        updatedAt: new Date(info.updatedAt.toNumber() * 1000)
      };
    } catch (error) {
      console.error('Failed to get dataset information:', error);
      throw error;
    }
  }

  /**
   * Update dataset metadata
   * @param {string} datasetId - Dataset ID
   * @param {Object} updateInfo - Update information
   * @param {string} updateInfo.name - Dataset name
   * @param {string} updateInfo.description - Dataset description
   * @param {string} updateInfo.metadataUri - Metadata URI
   * @param {number} networkId - Network ID
   * @returns {Promise<Object>} Transaction receipt
   */
  async updateDatasetMetadata(datasetId, updateInfo, networkId) {
    try {
      const contract = this.getContract(networkId);
      const tx = await contract.updateDatasetMetadata(
        datasetId,
        updateInfo.name,
        updateInfo.description,
        updateInfo.metadataUri
      );

      return await tx.wait();
    } catch (error) {
      console.error('Failed to update dataset metadata:', error);
      throw error;
    }
  }

  /**
   * Update dataset access control
   * @param {string} datasetId - Dataset ID
   * @param {boolean} isPublic - Whether it's public
   * @param {number} networkId - Network ID
   * @returns {Promise<Object>} Transaction receipt
   */
  async updateDatasetAccess(datasetId, isPublic, networkId) {
    try {
      const contract = this.getContract(networkId);
      const tx = await contract.updateDatasetAccess(datasetId, isPublic);
      return await tx.wait();
    } catch (error) {
      console.error('Failed to update dataset access control:', error);
      throw error;
    }
  }

  /**
   * Get dataset access key
   * @param {string} datasetId - Dataset ID
   * @param {string} requester - Requester address
   * @param {number} networkId - Network ID
   * @returns {Promise<string>} Encrypted key
   */
  async getDatasetAccessKey(datasetId, requester, networkId) {
    try {
      const contract = this.getContract(networkId);
      const encryptedKey = await contract.getDatasetAccessKey(datasetId, requester);
      return encryptedKey;
    } catch (error) {
      console.error('Failed to get dataset access key:', error);
      throw error;
    }
  }

  /**
   * Grant dataset access permission to a user
   * @param {string} datasetId - Dataset ID
   * @param {string} user - User address
   * @param {string} encryptedKey - Encrypted key
   * @param {number} networkId - Network ID
   * @returns {Promise<Object>} Transaction receipt
   */
  async grantDatasetAccess(datasetId, user, encryptedKey, networkId) {
    try {
      const contract = this.getContract(networkId);
      const tx = await contract.grantDatasetAccess(datasetId, user, encryptedKey);
      return await tx.wait();
    } catch (error) {
      console.error('Failed to grant dataset access:', error);
      throw error;
    }
  }

  /**
   * Revoke dataset access permission from a user
   * @param {string} datasetId - Dataset ID
   * @param {string} user - User address
   * @param {number} networkId - Network ID
   * @returns {Promise<Object>} Transaction receipt
   */
  async revokeDatasetAccess(datasetId, user, networkId) {
    try {
      const contract = this.getContract(networkId);
      const tx = await contract.revokeDatasetAccess(datasetId, user);
      return await tx.wait();
    } catch (error) {
      console.error('Failed to revoke dataset access:', error);
      throw error;
    }
  }

  /**
   * Check if a user has access to a dataset
   * @param {string} datasetId - Dataset ID
   * @param {string} user - User address
   * @param {number} networkId - Network ID
   * @returns {Promise<boolean>} Whether the user has access
   */
  async hasDatasetAccess(datasetId, user, networkId) {
    try {
      const contract = this.getContract(networkId);
      return await contract.hasDatasetAccess(datasetId, user);
    } catch (error) {
      console.error('Failed to check dataset access:', error);
      throw error;
    }
  }
}

// Create singleton instance
const dataRegistry = new DataRegistry();

export default dataRegistry;
