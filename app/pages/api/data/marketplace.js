/**
 * API Route: Data Marketplace
 *
 * Handles data marketplace operations in the SynergyAI network.
 * Provides endpoints for listing, searching, and purchasing datasets.
 */

import { ethers } from 'ethers';
import { DataVault } from '../../../blockchain/contracts/DataVault';
import { verifySignature } from '../../../utils/index';
import { getFromIPFS } from '../../../services/ipfsService';
import { encryptToString, decryptFromString } from '../../../utils/encryption';

export default async function handler(req, res) {
  // Handle GET method for listing and searching datasets
  if (req.method === 'GET') {
    try {
      const { query, category, page = 1, limit = 20, networkId, owner } = req.query;

      if (!networkId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required field: networkId'
        });
      }

      // Initialize provider and contract
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
      const dataVault = new DataVault(provider);

      // Get datasets based on query parameters
      let datasets = [];

      if (owner) {
        // Get datasets owned by a specific address
        datasets = await dataVault.getDatasetsByOwner(owner, networkId);
      } else {
        // Get all datasets available in the marketplace
        datasets = await dataVault.getAllMarketplaceDatasets(networkId);
      }

      // Apply category filter if specified
      if (category) {
        datasets = datasets.filter(dataset =>
          dataset.category && dataset.category.toLowerCase() === category.toLowerCase()
        );
      }

      // Apply text search if query is specified
      if (query) {
        const searchTerms = query.toLowerCase().split(' ');
        datasets = datasets.filter(dataset => {
          const name = dataset.name.toLowerCase();
          const description = dataset.description ? dataset.description.toLowerCase() : '';
          return searchTerms.some(term =>
            name.includes(term) || description.includes(term)
          );
        });
      }

      // Apply pagination
      const startIndex = (page - 1) * limit;
      const paginatedDatasets = datasets.slice(startIndex, startIndex + parseInt(limit));

      // Enhance with IPFS metadata where available
      const enhancedDatasets = await Promise.all(
        paginatedDatasets.map(async (dataset) => {
          let enhancedData = { ...dataset };

          // Fetch detailed metadata from IPFS if available
          if (dataset.metadataUri && dataset.metadataUri.startsWith('ipfs://')) {
            try {
              const cid = dataset.metadataUri.replace('ipfs://', '');
              const metadata = await getFromIPFS(cid);
              const parsedMetadata = JSON.parse(metadata);

              // Merge IPFS metadata with basic dataset info
              enhancedData = {
                ...enhancedData,
                ...parsedMetadata,
                fullMetadata: parsedMetadata
              };
            } catch (error) {
              console.error(`Error retrieving metadata for dataset ${dataset.id}:`, error);
              // Continue with limited information
            }
          }

          return enhancedData;
        })
      );

      return res.status(200).json({
        success: true,
        total: datasets.length,
        page: parseInt(page),
        limit: parseInt(limit),
        datasets: enhancedDatasets
      });
    } catch (error) {
      console.error('Error listing datasets:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to list datasets',
        error: error.message
      });
    }
  }

  // Handle POST method for purchasing dataset access
  else if (req.method === 'POST') {
    try {
      const {
        datasetId,
        accessLevel,
        paymentAmount,
        signature,
        address,
        networkId
      } = req.body;

      // Validate required fields
      if (!datasetId || !accessLevel || !signature || !address || !networkId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the buyer
      const message = JSON.stringify({
        action: 'purchase-dataset',
        datasetId,
        accessLevel,
        paymentAmount,
        timestamp: Math.floor(Date.now() / 1000)
      });

      const isValidSignature = await verifySignature(address, message, signature);

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Initialize provider
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

      // Check if the dataset exists
      const dataVault = new DataVault(provider);
      const datasetInfo = await dataVault.getDatasetInfo(datasetId, networkId);

      if (!datasetInfo) {
        return res.status(404).json({
          success: false,
          message: 'Dataset not found'
        });
      }

      // Use server-side signer for processing the purchase
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const dataVaultWithSigner = new DataVault(signer);

      // Process the purchase transaction
      const receipt = await dataVaultWithSigner.purchaseDatasetAccess(
        datasetId,
        address,
        accessLevel,
        ethers.utils.parseEther(paymentAmount.toString()),
        networkId
      );

      // Return success response with transaction details
      return res.status(200).json({
        success: true,
        message: 'Dataset access purchased successfully',
        datasetId,
        accessLevel,
        transactionHash: receipt.transactionHash
      });
    } catch (error) {
      console.error('Error purchasing dataset access:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to purchase dataset access',
        error: error.message
      });
    }
  }

  // Handle PUT method for updating dataset listing
  else if (req.method === 'PUT') {
    try {
      const {
        datasetId,
        price,
        isListed,
        accessLevels,
        signature,
        address,
        networkId
      } = req.body;

      // Validate required fields
      if (!datasetId || !signature || !address || !networkId) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields'
        });
      }

      // Verify signature to authenticate the owner
      const message = JSON.stringify({
        action: 'update-dataset-listing',
        datasetId,
        timestamp: Math.floor(Date.now() / 1000)
      });

      const isValidSignature = await verifySignature(address, message, signature);

      if (!isValidSignature) {
        return res.status(401).json({
          success: false,
          message: 'Invalid signature'
        });
      }

      // Initialize provider
      const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

      // Check if the dataset exists and user is the owner
      const dataVault = new DataVault(provider);
      const datasetInfo = await dataVault.getDatasetInfo(datasetId, networkId);

      if (!datasetInfo) {
        return res.status(404).json({
          success: false,
          message: 'Dataset not found'
        });
      }

      // Verify ownership
      if (datasetInfo.owner.toLowerCase() !== address.toLowerCase()) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to update this dataset'
        });
      }

      // Use server-side signer for updating the listing
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
      const dataVaultWithSigner = new DataVault(signer);

      // Process the update
      const receipt = await dataVaultWithSigner.updateDatasetListing(
        datasetId,
        price !== undefined ? ethers.utils.parseEther(price.toString()) : undefined,
        isListed !== undefined ? isListed : undefined,
        accessLevels !== undefined ? JSON.stringify(accessLevels) : undefined,
        networkId
      );

      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Dataset listing updated successfully',
        datasetId,
        transactionHash: receipt.transactionHash
      });
    } catch (error) {
      console.error('Error updating dataset listing:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update dataset listing',
        error: error.message
      });
    }
  }

  // Reject other HTTP methods
  else {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
