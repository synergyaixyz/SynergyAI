/**
 * Dataset Management Hook
 *
 * Provides functionality for dataset operations, including fetching, uploading, downloading, and sharing datasets
 */

import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { ethers } from 'ethers';
import { encrypt, decrypt, generateRandomKey } from '../utils/encryption';
import { useWallet } from './useWallet';

// Mock dataset data
const mockDatasets = [
  {
    id: '1',
    name: 'Financial Transaction Dataset',
    description: 'Contains historical stock and futures trading data, suitable for quantitative trading model training',
    owner: '0x1234567890123456789012345678901234567890',
    size: 1024 * 1024 * 150, // 150MB
    fileCount: 3,
    createdAt: '2023-09-15T08:30:00Z',
    lastModified: '2023-09-15T08:30:00Z',
    isPublic: true,
    isEncrypted: false,
    tags: ['Finance', 'Trading', 'Stocks'],
    files: [
      { name: 'stocks_data.csv', size: 1024 * 1024 * 75, type: 'text/csv' },
      { name: 'futures_data.csv', size: 1024 * 1024 * 45, type: 'text/csv' },
      { name: 'readme.md', size: 1024 * 5, type: 'text/markdown' }
    ]
  },
  {
    id: '2',
    name: 'Medical Imaging Dataset',
    description: 'Brain MRI scan images, anonymized, suitable for medical image analysis research',
    owner: '0x1234567890123456789012345678901234567890',
    size: 1024 * 1024 * 500, // 500MB
    fileCount: 4,
    createdAt: '2023-10-05T14:20:00Z',
    lastModified: '2023-10-07T09:15:00Z',
    isPublic: false,
    isEncrypted: true,
    tags: ['Medical', 'MRI', 'Brain'],
    files: [
      { name: 'brain_scans.zip', size: 1024 * 1024 * 450, type: 'application/zip' },
      { name: 'metadata.json', size: 1024 * 15, type: 'application/json' },
      { name: 'patient_info.csv', size: 1024 * 1024 * 2, type: 'text/csv' },
      { name: 'research_notes.pdf', size: 1024 * 1024 * 3, type: 'application/pdf' }
    ],
    sharedWith: ['0x2345678901234567890123456789012345678901']
  },
  {
    id: '3',
    name: 'Smart Customer Service Dialogue Data',
    description: 'Dataset of customer service and user conversation records, anonymized, suitable for NLP and chatbot training',
    owner: '0x1234567890123456789012345678901234567890',
    size: 1024 * 1024 * 50, // 50MB
    fileCount: 2,
    createdAt: '2023-11-12T10:45:00Z',
    lastModified: '2023-11-12T10:45:00Z',
    isPublic: false,
    isEncrypted: false,
    tags: ['NLP', 'Customer Service', 'Dialogue'],
    files: [
      { name: 'conversations.json', size: 1024 * 1024 * 48, type: 'application/json' },
      { name: 'schema.txt', size: 1024 * 5, type: 'text/plain' }
    ]
  }
];

const mockPublicDatasets = [
  {
    id: '4',
    name: 'Urban Traffic Flow Data',
    description: 'Real-time and historical traffic flow data for major cities, suitable for traffic prediction and planning research',
    owner: '0x5678901234567890123456789012345678901234',
    size: 1024 * 1024 * 300, // 300MB
    fileCount: 5,
    createdAt: '2023-08-20T11:30:00Z',
    lastModified: '2023-11-15T16:40:00Z',
    isPublic: true,
    isEncrypted: false,
    tags: ['Traffic', 'Urban', 'Data Analysis'],
    files: [
      { name: 'traffic_history.csv', size: 1024 * 1024 * 200, type: 'text/csv' },
      { name: 'realtime_sample.json', size: 1024 * 1024 * 50, type: 'application/json' },
      { name: 'map_data.geojson', size: 1024 * 1024 * 30, type: 'application/geo+json' },
      { name: 'analysis_tools.py', size: 1024 * 20, type: 'text/x-python' },
      { name: 'documentation.pdf', size: 1024 * 1024 * 2, type: 'application/pdf' }
    ]
  },
  {
    id: '5',
    name: 'Natural Language Processing Benchmark Dataset',
    description: 'Multilingual NLP benchmark dataset, including labeled data for sentiment analysis, text classification, and other tasks',
    owner: '0x6789012345678901234567890123456789012345',
    size: 1024 * 1024 * 80, // 80MB
    fileCount: 3,
    createdAt: '2023-07-05T08:15:00Z',
    lastModified: '2023-07-05T08:15:00Z',
    isPublic: true,
    isEncrypted: false,
    tags: ['NLP', 'Machine Learning', 'Multilingual'],
    files: [
      { name: 'sentiment_analysis.jsonl', size: 1024 * 1024 * 30, type: 'application/jsonl' },
      { name: 'text_classification.jsonl', size: 1024 * 1024 * 45, type: 'application/jsonl' },
      { name: 'benchmark_tools.zip', size: 1024 * 1024 * 5, type: 'application/zip' }
    ]
  }
];

/**
 * Dataset Management Hook
 * Provides functionality to fetch, upload, download, and share datasets
 */
export const useDataset = () => {
  const { account, isConnected, chainId, isValidNetwork } = useWallet();
  const [userDatasets, setUserDatasets] = useState([]);
  const [publicDatasets, setPublicDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [decryptedData, setDecryptedData] = useState(null);
  const [encryptionKeys, setEncryptionKeys] = useState({});
  const [loadingState, setLoadingState] = useState({
    loading: false,
    error: null,
    success: false
  });

  // Load encryption keys from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedKeys = localStorage.getItem('encryptionKeys');
        if (savedKeys) {
          setEncryptionKeys(JSON.parse(savedKeys));
        }
      } catch (error) {
        console.error('Failed to read stored encryption keys:', error);
      }
    }
  }, []);

  // Save encryption keys to local storage
  useEffect(() => {
    if (typeof window !== 'undefined' && Object.keys(encryptionKeys).length > 0) {
      try {
        localStorage.setItem('encryptionKeys', JSON.stringify(encryptionKeys));
      } catch (error) {
        console.error('Failed to save encryption keys:', error);
      }
    }
  }, [encryptionKeys]);

  // Initialize data
  useEffect(() => {
    if (isConnected && isValidNetwork) {
      refreshDatasets();
    }
  }, [isConnected, isValidNetwork]);

  // Refresh datasets
  const refreshDatasets = useCallback(() => {
    setLoadingState({ loading: true, error: null, success: false });

    try {
      // Simulate API call delay
      setTimeout(() => {
        setUserDatasets(mockDatasets);
        setPublicDatasets(mockPublicDatasets);
        setLoadingState({ loading: false, error: null, success: true });
      }, 500);
    } catch (error) {
      console.error('Failed to fetch datasets:', error);
      setLoadingState({ loading: false, error: 'Failed to fetch datasets', success: false });
    }
  }, []);

  // Get dataset details
  const fetchDatasetDetails = useCallback(async (datasetId) => {
    if (!isConnected || !isValidNetwork) {
      throw new Error('Please connect your wallet and ensure you are on the correct network');
    }

    setLoadingState({ loading: true, error: null, success: false });

    try {
      // Find dataset
      const allDatasets = [...userDatasets, ...publicDatasets];
      const dataset = allDatasets.find(ds => ds.id === datasetId);

      if (!dataset) {
        throw new Error('Dataset does not exist');
      }

      // Simulate fetching more data from the blockchain
      // In a real application, this would call a smart contract for more details
      await new Promise(resolve => setTimeout(resolve, 500));

      // If the dataset doesn't have file information, add mock data
      if (!dataset.files) {
        const fileExtensions = ['csv', 'json', 'txt', 'pdf', 'zip'];
        const fileTypes = ['text/csv', 'application/json', 'text/plain', 'application/pdf', 'application/zip'];

        // Generate random files
        const fileCount = Math.floor(Math.random() * 5) + 1;
        const files = [];

        for (let i = 0; i < fileCount; i++) {
          const extIndex = Math.floor(Math.random() * fileExtensions.length);
          const fileSize = Math.floor(Math.random() * 1024 * 1024 * 100) + 1024 * 1024; // 1MB - 100MB

          files.push({
            name: `file_${i + 1}.${fileExtensions[extIndex]}`,
            size: fileSize,
            type: fileTypes[extIndex]
          });
        }

        dataset.files = files;
        dataset.fileCount = files.length;
      }

      setLoadingState({ loading: false, error: null, success: true });
      return dataset;
    } catch (error) {
      console.error('Failed to fetch dataset details:', error);
      setLoadingState({ loading: false, error: 'Failed to fetch dataset details', success: false });
      throw error;
    }
  }, [userDatasets, publicDatasets, isConnected, isValidNetwork]);

  // Upload dataset
  const uploadDataset = useCallback(async (datasetInfo, onProgress) => {
    if (!isConnected || !isValidNetwork) {
      return { success: false, error: 'Please connect your wallet and ensure you are on the correct network' };
    }

    setLoadingState({ loading: true, error: null, success: false });

    try {
      // Simulate upload progress
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 100) {
          onProgress && onProgress(progress);
        } else {
          clearInterval(progressInterval);
        }
      }, 300);

      // If the dataset needs encryption, save the encryption key
      if (datasetInfo.isEncrypted) {
        const encryptionKey = datasetInfo.encryptionKey || generateRandomKey();
        setEncryptionKeys(prevKeys => ({
          ...prevKeys,
          [datasetInfo.id]: encryptionKey
        }));
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Generate new dataset
      const newDataset = {
        id: Math.random().toString(36).substring(2, 9), // Generate random ID
        name: datasetInfo.name,
        description: datasetInfo.description,
        owner: account,
        size: datasetInfo.size || 1024 * 1024 * Math.floor(Math.random() * 100 + 1), // Random size
        fileCount: datasetInfo.fileCount || 1,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        isPublic: !!datasetInfo.isPublic,
        isEncrypted: !!datasetInfo.isEncrypted,
        tags: datasetInfo.tags || [],
        files: datasetInfo.files || [{
          name: 'data.csv',
          size: 1024 * 1024 * Math.floor(Math.random() * 50 + 1),
          type: 'text/csv'
        }]
      };

      // Update user datasets
      setUserDatasets(prev => [newDataset, ...prev]);

      // Clear interval and update state
      clearInterval(progressInterval);
      setLoadingState({ loading: false, error: null, success: true });

      return {
        success: true,
        datasetId: newDataset.id
      };
    } catch (error) {
      console.error('Failed to upload dataset:', error);
      setLoadingState({ loading: false, error: 'Failed to upload dataset', success: false });
      return { success: false, error: error.message };
    }
  }, [account, isConnected, isValidNetwork]);

  // Download dataset
  const downloadDataset = useCallback(async (datasetId) => {
    if (!isConnected || !isValidNetwork) {
      throw new Error('Please connect your wallet and ensure you are on the correct network');
    }

    setLoadingState({ loading: true, error: null, success: false });

    try {
      // Find dataset
      const allDatasets = [...userDatasets, ...publicDatasets];
      const dataset = allDatasets.find(ds => ds.id === datasetId);

      if (!dataset) {
        throw new Error('Dataset does not exist');
      }

      // If the dataset is encrypted, check if we have the key
      if (dataset.isEncrypted) {
        const key = encryptionKeys[datasetId];
        if (!key) {
          throw new Error('Missing decryption key, cannot download encrypted dataset');
        }
      }

      // Simulate file download
      // In a real application, this would fetch from IPFS or another decentralized storage
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create a dummy content
      const dummyContent = `This is example content for dataset ${dataset.name}`;
      const blob = new Blob([dummyContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger it
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataset.name.replace(/\s+/g, '_')}_data.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLoadingState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      console.error('Failed to download dataset:', error);
      setLoadingState({ loading: false, error: 'Failed to download dataset', success: false });
      throw error;
    }
  }, [userDatasets, publicDatasets, encryptionKeys, isConnected, isValidNetwork]);

  // Share dataset
  const shareDataset = useCallback(async (datasetId, recipientAddress, shareKey = true) => {
    if (!isConnected || !isValidNetwork) {
      throw new Error('Please connect your wallet and ensure you are on the correct network');
    }

    setLoadingState({ loading: true, error: null, success: false });

    try {
      if (!ethers.utils.isAddress(recipientAddress)) {
        throw new Error('Invalid Ethereum address');
      }

      // Find dataset
      const dataset = userDatasets.find(ds => ds.id === datasetId && ds.owner === account);

      if (!dataset) {
        throw new Error('Dataset does not exist or you do not have permission to share');
      }

      // Simulate transaction for granting access
      // In a real application, this would call a smart contract to update permissions
      await new Promise(resolve => setTimeout(resolve, 1000));

      // If the dataset is encrypted and we're sharing the key, we would encrypt the key with the recipient's
      // public key and store it in the contract - here we just simulate that
      let updatedDataset = { ...dataset };
      if (!updatedDataset.sharedWith) {
        updatedDataset.sharedWith = [];
      }

      if (!updatedDataset.sharedWith.includes(recipientAddress)) {
        updatedDataset.sharedWith = [...updatedDataset.sharedWith, recipientAddress];
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update the dataset in the state
      setUserDatasets(prev => prev.map(ds => ds.id === datasetId ? updatedDataset : ds));

      setLoadingState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      console.error('Failed to share dataset:', error);
      setLoadingState({ loading: false, error: 'Failed to share dataset', success: false });
      throw error;
    }
  }, [account, userDatasets, isConnected, isValidNetwork]);

  // Get and decrypt dataset content
  const fetchDatasetContent = useCallback(async (datasetId) => {
    if (!isConnected || !isValidNetwork) {
      throw new Error('Please connect your wallet and ensure you are on the correct network');
    }

    setLoadingState({ loading: true, error: null, success: false });

    try {
      // Find dataset
      const allDatasets = [...userDatasets, ...publicDatasets];
      const dataset = allDatasets.find(ds => ds.id === datasetId);

      if (!dataset) {
        throw new Error('Dataset does not exist');
      }

      // Check access permissions
      if (!dataset.isPublic && dataset.owner !== account && (!dataset.sharedWith || !dataset.sharedWith.includes(account))) {
        throw new Error('You do not have permission to access this dataset');
      }

      // Get data content (simulated)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Simulate data content
      const content = {
        data: "This is example data content before encryption",
        metadata: {
          description: dataset.description,
          createdAt: dataset.createdAt,
          tags: dataset.tags
        }
      };

      // If the dataset is encrypted, we need to decrypt it
      if (dataset.isEncrypted) {
        const key = encryptionKeys[datasetId];

        if (!key) {
          throw new Error('Missing decryption key, cannot access encrypted data');
        }

        // In a real app, this would decrypt the actual data
        // Here we just simulate the decryption step
        await new Promise(resolve => setTimeout(resolve, 500));

        // Store the key used for this dataset for future use
        setEncryptionKeys(prevKeys => ({
          ...prevKeys,
          [datasetId]: key
        }));

        // Store the decrypted data
        setDecryptedData({
          datasetId,
          content
        });

        setLoadingState({ loading: false, error: null, success: true });
        return content;
      }

      // Non-encrypted data is returned directly
      setDecryptedData({
        datasetId,
        content
      });

      setLoadingState({ loading: false, error: null, success: true });
      return content;
    } catch (error) {
      console.error('Failed to fetch dataset content:', error);
      setLoadingState({ loading: false, error: 'Failed to fetch dataset content', success: false });
      throw error;
    }
  }, [account, userDatasets, publicDatasets, encryptionKeys, isConnected, isValidNetwork]);

  // Update dataset access control
  const updateDatasetAccess = useCallback(async (datasetId, isPublic) => {
    if (!isConnected || !isValidNetwork) {
      throw new Error('Please connect your wallet and ensure you are on the correct network');
    }

    setLoadingState({ loading: true, error: null, success: false });

    try {
      // Find dataset
      const dataset = userDatasets.find(ds => ds.id === datasetId && ds.owner === account);

      if (!dataset) {
        throw new Error('Dataset does not exist or you do not have permission to modify');
      }

      // Simulate transaction for updating access
      // In a real application, this would call a smart contract method
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update dataset
      const updatedDataset = {
        ...dataset,
        isPublic,
        lastModified: new Date().toISOString()
      };

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update the dataset in the state
      setUserDatasets(prev => prev.map(ds => ds.id === datasetId ? updatedDataset : ds));

      setLoadingState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      console.error('Failed to update dataset access control:', error);
      setLoadingState({ loading: false, error: 'Failed to update dataset access control', success: false });
      throw error;
    }
  }, [account, userDatasets, isConnected, isValidNetwork]);

  // Delete dataset
  const deleteDataset = useCallback(async (datasetId) => {
    if (!isConnected || !isValidNetwork) {
      throw new Error('Please connect your wallet and ensure you are on the correct network');
    }

    setLoadingState({ loading: true, error: null, success: false });

    try {
      // Find dataset
      const dataset = userDatasets.find(ds => ds.id === datasetId && ds.owner === account);

      if (!dataset) {
        throw new Error('Dataset does not exist or you do not have permission to delete');
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Delete dataset
      setUserDatasets(prev => prev.filter(ds => ds.id !== datasetId));

      setLoadingState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      console.error('Failed to delete dataset:', error);
      setLoadingState({ loading: false, error: 'Failed to delete dataset', success: false });
      throw error;
    }
  }, [account, userDatasets, isConnected, isValidNetwork]);

  // Grant access to a dataset
  const grantAccess = useCallback(async (datasetId, address) => {
    return shareDataset(datasetId, address, true);
  }, [shareDataset]);

  // Revoke access from a dataset
  const revokeAccess = useCallback(async (datasetId, address) => {
    if (!isConnected || !isValidNetwork) {
      throw new Error('Please connect your wallet and ensure you are on the correct network');
    }

    setLoadingState({ loading: true, error: null, success: false });

    try {
      // Find dataset
      const dataset = userDatasets.find(ds => ds.id === datasetId && ds.owner === account);

      if (!dataset || !dataset.sharedWith) {
        throw new Error('Dataset does not exist or has no shared access to revoke');
      }

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update dataset removing the address from sharedWith
      const updatedDataset = {
        ...dataset,
        sharedWith: dataset.sharedWith.filter(addr => addr !== address),
        lastModified: new Date().toISOString()
      };

      // Update the dataset in the state
      setUserDatasets(prev => prev.map(ds => ds.id === datasetId ? updatedDataset : ds));

      setLoadingState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      console.error('Failed to revoke access:', error);
      setLoadingState({ loading: false, error: 'Failed to revoke access', success: false });
      throw error;
    }
  }, [account, userDatasets, isConnected, isValidNetwork]);

  // Check if user has access to a dataset
  const checkAccess = useCallback((datasetId) => {
    const allDatasets = [...userDatasets, ...publicDatasets];
    const dataset = allDatasets.find(ds => ds.id === datasetId);

    if (!dataset) {
      return false;
    }

    // User has access if:
    // 1. The dataset is public
    // 2. User is the owner
    // 3. User is in the sharedWith list
    return dataset.isPublic ||
           dataset.owner === account ||
           (dataset.sharedWith && dataset.sharedWith.includes(account));
  }, [account, userDatasets, publicDatasets]);

  // Update dataset metadata
  const updateDatasetMetadata = useCallback(async (datasetId, metadata) => {
    if (!isConnected || !isValidNetwork) {
      throw new Error('Please connect your wallet and ensure you are on the correct network');
    }

    setLoadingState({ loading: true, error: null, success: false });

    try {
      // Find dataset
      const dataset = userDatasets.find(ds => ds.id === datasetId && ds.owner === account);

      if (!dataset) {
        throw new Error('Dataset does not exist or you do not have permission to modify');
      }

      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update dataset with new metadata
      const updatedDataset = {
        ...dataset,
        name: metadata.name || dataset.name,
        description: metadata.description || dataset.description,
        tags: metadata.tags || dataset.tags,
        lastModified: new Date().toISOString()
      };

      // Update the dataset in the state
      setUserDatasets(prev => prev.map(ds => ds.id === datasetId ? updatedDataset : ds));

      setLoadingState({ loading: false, error: null, success: true });
      return true;
    } catch (error) {
      console.error('Failed to update dataset metadata:', error);
      setLoadingState({ loading: false, error: 'Failed to update dataset metadata', success: false });
      throw error;
    }
  }, [account, userDatasets, isConnected, isValidNetwork]);

  return {
    loading: loadingState.loading,
    error: loadingState.error,
    success: loadingState.success,
    loadingState,
    userDatasets,
    publicDatasets,
    selectedDataset,
    setSelectedDataset,
    decryptedData,
    refreshDatasets,
    fetchUserDatasets: refreshDatasets,
    fetchPublicDatasets: refreshDatasets,
    fetchDatasetDetails,
    uploadDataset,
    downloadDataset,
    shareDataset,
    fetchDatasetContent,
    updateDatasetAccess,
    deleteDataset,
    grantAccess,
    revokeAccess,
    checkAccess,
    updateDatasetMetadata
  };
};

// Ensure both default export and named export are supported
export default useDataset;
export { useDataset };
