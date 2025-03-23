import { ethers } from 'ethers';
import { getContractAddress } from './networkConfig';
import SYNTokenABI from './contracts/SYNToken.json';
import AIPTokenABI from './contracts/AIPToken.json';
import DataVaultABI from './contracts/DataVault.json';
import ComputeManagerABI from './contracts/ComputeManager.json';

/**
 * Get the network ID from provider
 * @param {ethers.providers.Provider} provider - Provider instance
 * @returns {Promise<number>} Network ID
 */
export const getNetworkId = async (provider) => {
  const network = await provider.getNetwork();
  return parseInt(network.chainId);
};

/**
 * Get SYN token contract instance
 * @param {ethers.providers.Provider | ethers.Signer} providerOrSigner - Provider or Signer instance
 * @returns {Promise<ethers.Contract>} SYN token contract instance
 */
export const getSYNTokenContract = async (providerOrSigner) => {
  const networkId = await getNetworkId(
    providerOrSigner.provider || providerOrSigner
  );
  
  const address = getContractAddress(networkId, 'SYNToken');
  return new ethers.Contract(address, SYNTokenABI.abi, providerOrSigner);
};

/**
 * Get AIP token contract instance
 * @param {ethers.providers.Provider | ethers.Signer} providerOrSigner - Provider or Signer instance
 * @returns {Promise<ethers.Contract>} AIP token contract instance
 */
export const getAIPTokenContract = async (providerOrSigner) => {
  const networkId = await getNetworkId(
    providerOrSigner.provider || providerOrSigner
  );
  
  const address = getContractAddress(networkId, 'AIPToken');
  return new ethers.Contract(address, AIPTokenABI.abi, providerOrSigner);
};

/**
 * Get Data Vault contract instance
 * @param {ethers.providers.Provider | ethers.Signer} providerOrSigner - Provider or Signer instance
 * @returns {Promise<ethers.Contract>} Data Vault contract instance
 */
export const getDataVaultContract = async (providerOrSigner) => {
  const networkId = await getNetworkId(
    providerOrSigner.provider || providerOrSigner
  );
  
  const address = getContractAddress(networkId, 'DataVault');
  return new ethers.Contract(address, DataVaultABI.abi, providerOrSigner);
};

/**
 * Get Compute Manager contract instance
 * @param {ethers.providers.Provider | ethers.Signer} providerOrSigner - Provider or Signer instance
 * @returns {Promise<ethers.Contract>} Compute Manager contract instance
 */
export const getComputeManagerContract = async (providerOrSigner) => {
  const networkId = await getNetworkId(
    providerOrSigner.provider || providerOrSigner
  );
  
  const address = getContractAddress(networkId, 'ComputeManager');
  return new ethers.Contract(address, ComputeManagerABI.abi, providerOrSigner);
};

/**
 * Get user's SYN token balance
 * @param {string} address - User address
 * @param {ethers.providers.Provider} provider - Provider instance
 * @returns {Promise<string>} Formatted balance
 */
export const getSYNBalance = async (address, provider) => {
  try {
    const contract = await getSYNTokenContract(provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, 18); // Assuming SYN token has 18 decimals
  } catch (error) {
    console.error('Error getting SYN balance:', error);
    return '0';
  }
};

/**
 * Get user's AIP token balance
 * @param {string} address - User address
 * @param {ethers.providers.Provider} provider - Provider instance
 * @returns {Promise<string>} Formatted balance
 */
export const getAIPBalance = async (address, provider) => {
  try {
    const contract = await getAIPTokenContract(provider);
    const balance = await contract.balanceOf(address);
    return ethers.formatUnits(balance, 18); // Assuming AIP token has 18 decimals
  } catch (error) {
    console.error('Error getting AIP balance:', error);
    return '0';
  }
};

/**
 * Stake SYN tokens
 * @param {string} amount - Stake amount
 * @param {ethers.Signer} signer - Signer instance
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const stakeSYN = async (amount, signer) => {
  try {
    const contract = await getSYNTokenContract(signer);
    const amountWei = ethers.parseUnits(amount, 18);
    const tx = await contract.stake(await signer.getAddress(), amountWei);
    return tx;
  } catch (error) {
    console.error('Error staking SYN:', error);
    throw error;
  }
};

/**
 * Unstake SYN tokens
 * @param {string} amount - Unstake amount
 * @param {ethers.Signer} signer - Signer instance
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const unstakeSYN = async (amount, signer) => {
  try {
    const contract = await getSYNTokenContract(signer);
    const amountWei = ethers.parseUnits(amount, 18);
    const tx = await contract.unstake(amountWei);
    return tx;
  } catch (error) {
    console.error('Error unstaking SYN:', error);
    throw error;
  }
};

/**
 * Get compute resource cost
 * @param {string} computeAmount - Compute resource amount
 * @param {string} computeType - Compute resource type
 * @param {number} duration - Compute duration (seconds)
 * @param {ethers.providers.Provider} provider - Provider instance
 * @returns {Promise<string>} Formatted cost
 */
export const getComputeCost = async (computeAmount, computeType, duration, provider) => {
  try {
    const contract = await getComputeManagerContract(provider);
    const cost = await contract.calculateCost(computeAmount, computeType, duration);
    return ethers.formatUnits(cost, 18);
  } catch (error) {
    console.error('Error getting compute cost:', error);
    return '0';
  }
};

/**
 * Purchase compute resources
 * @param {string} computeAmount - Compute resource amount
 * @param {string} computeType - Compute resource type
 * @param {number} duration - Compute duration (seconds)
 * @param {ethers.Signer} signer - Signer instance
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const purchaseCompute = async (computeAmount, computeType, duration, signer) => {
  try {
    const computeContract = await getComputeManagerContract(signer);
    
    // First need to approve AIP token spending for compute purchase
    const aipContract = await getAIPTokenContract(signer);
    const cost = await computeContract.calculateCost(computeAmount, computeType, duration);
    const approveTx = await aipContract.approve(
      await computeContract.getAddress(),
      cost
    );
    await approveTx.wait();
    
    // Then purchase compute
    const tx = await computeContract.purchaseCompute(computeAmount, computeType, duration);
    return tx;
  } catch (error) {
    console.error('Error purchasing compute resources:', error);
    throw error;
  }
};

/**
 * Register a compute node
 * @param {Object} specs - Hardware specifications
 * @param {string} nodeUrl - Node API URL
 * @param {ethers.Signer} signer - Signer instance
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const registerComputeNode = async (specs, nodeUrl, signer) => {
  try {
    const contract = await getComputeManagerContract(signer);
    const tx = await contract.registerNode(
      specs.nodeType || 'gpu',
      specs.performance || '100',
      JSON.stringify(specs),
      nodeUrl
    );
    return tx;
  } catch (error) {
    console.error('Error registering compute node:', error);
    throw error;
  }
};

/**
 * Submit a compute task
 * @param {Object} taskDefinition - Task definition (model, data, requirements)
 * @param {ethers.Signer} signer - Signer instance
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const submitComputeTask = async (taskDefinition, signer) => {
  try {
    const contract = await getComputeManagerContract(signer);
    const tx = await contract.submitTask(
      taskDefinition.modelId,
      taskDefinition.dataRefs,
      JSON.stringify(taskDefinition.requirements),
      taskDefinition.maxCost
    );
    return tx;
  } catch (error) {
    console.error('Error submitting compute task:', error);
    throw error;
  }
};

/**
 * Add data to vault
 * @param {string} dataId - Data ID
 * @param {string} metadataURI - Metadata URI
 * @param {string} encryptedDataURI - Encrypted data URI
 * @param {string} dataType - Data type
 * @param {ethers.Signer} signer - Signer instance
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const addDataToVault = async (dataId, metadataURI, encryptedDataURI, dataType, signer) => {
  try {
    const contract = await getDataVaultContract(signer);
    const tx = await contract.addData(dataId, metadataURI, encryptedDataURI, dataType);
    return tx;
  } catch (error) {
    console.error('Error adding data to vault:', error);
    throw error;
  }
};

/**
 * Grant data access permission
 * @param {string} dataId - Data ID
 * @param {string} accessor - Accessor address
 * @param {number} expirationTime - Expiration time stamp
 * @param {ethers.Signer} signer - Signer instance
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const grantDataAccess = async (dataId, accessor, expirationTime, signer) => {
  try {
    const contract = await getDataVaultContract(signer);
    const tx = await contract.grantAccess(dataId, accessor, expirationTime);
    return tx;
  } catch (error) {
    console.error('Error granting data access:', error);
    throw error;
  }
};

/**
 * Revoke data access permission
 * @param {string} dataId - Data ID
 * @param {string} accessor - Accessor address
 * @param {ethers.Signer} signer - Signer instance
 * @returns {Promise<ethers.providers.TransactionResponse>} Transaction response
 */
export const revokeDataAccess = async (dataId, accessor, signer) => {
  try {
    const contract = await getDataVaultContract(signer);
    const tx = await contract.revokeAccess(dataId, accessor);
    return tx;
  } catch (error) {
    console.error('Error revoking data access:', error);
    throw error;
  }
};

/**
 * Get user's owned data ID list
 * @param {string} address - User address
 * @param {ethers.providers.Provider} provider - Provider instance
 * @returns {Promise<string[]>} Data ID array
 */
export const getOwnedDataIds = async (address, provider) => {
  try {
    const contract = await getDataVaultContract(provider);
    const dataIds = await contract.getOwnedDataIds(address);
    return dataIds;
  } catch (error) {
    console.error('Error getting owned data IDs:', error);
    return [];
  }
};

/**
 * Get user's accessible data information
 * @param {string} address - User address
 * @param {ethers.providers.Provider} provider - Provider instance
 * @returns {Promise<Array>} Accessible data information array
 */
export const getAccessibleData = async (address, provider) => {
  try {
    const contract = await getDataVaultContract(provider);
    const accessibleDataIds = await contract.getAccessibleDataIds(address);
    
    return Promise.all(accessibleDataIds.map(async (dataId) => {
      const { owner, expirationTime } = await contract.getAccessDetails(dataId, address);
      return {
        dataId,
        owner,
        expirationTime: new Date(Number(expirationTime) * 1000).toLocaleString()
      };
    }));
  } catch (error) {
    console.error('Error getting accessible data:', error);
    return [];
  }
}; 