/**
 * Data Page
 *
 * Provides dataset management, upload, and sharing functionality
 */

import React, { useState, useEffect } from 'react';
import {
  Tabs, Button, Card, Row, Col, Space, Alert,
  Typography, Modal, message, Tag, Table, Empty, Input, List, Spin
} from 'antd';
import {
  CloudUploadOutlined, DatabaseOutlined,
  GlobalOutlined, LockOutlined, ShareAltOutlined,
  DownloadOutlined, KeyOutlined, UserOutlined, TeamOutlined
} from '@ant-design/icons';
import { useWallet } from '../hooks/useWallet';
import { useDataset } from '../hooks/useDataset';
import DataBrowser from '../components/DataBrowser';
import DataUpload from '../components/DataUpload';
import { formatAddress } from '../utils/formatting';
import { providerService } from '../blockchain/providerService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Search } = Input;

const DataPage = () => {
  const {
    account, isConnected, connectWallet, isValidNetwork, switchNetwork, chainId
  } = useWallet();

  const {
    userDatasets,
    publicDatasets,
    fetchDatasetDetails,
    downloadDataset,
    shareDataset,
    updateDatasetAccess,
    loadingState,
    refreshDatasets,
    fetchUserDatasets,
    fetchPublicDatasets,
    grantAccess,
    loading: datasetLoading,
    error: datasetError
  } = useDataset();

  const [activeTab, setActiveTab] = useState('myData');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetDetails, setDatasetDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareAddress, setShareAddress] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize and set event listeners
  useEffect(() => {
    const initProvider = async () => {
      try {
        // Setup provider
        await providerService.initialize();

        // Check if wallet is connected
        const accounts = await providerService.getAccounts();
        if (accounts && accounts.length > 0) {
          setIsConnected(true);
          setAccount(accounts[0]);

          // Check network
          const networkId = await providerService.getNetworkId();
          setIsValidNetwork(providerService.isValidNetwork(networkId));
        }

        // Setup provider listeners
        providerService.onAccountsChanged((accounts) => {
          if (accounts.length === 0) {
            setIsConnected(false);
            setAccount(null);
          } else {
            setIsConnected(true);
            setAccount(accounts[0]);
            refreshData();
          }
        });

        providerService.onChainChanged((chainId) => {
          const networkId = parseInt(chainId, 16);
          setIsValidNetwork(providerService.isValidNetwork(networkId));
          if (providerService.isValidNetwork(networkId)) {
            refreshData();
          }
        });
      } catch (error) {
        console.error('Failed to initialize provider:', error);
      }
    };

    initProvider();
  }, []);

  // Handle wallet connection
  const handleConnect = async () => {
    try {
      setLoading(true);
      await providerService.connectWallet();
      const accounts = await providerService.getAccounts();
      if (accounts && accounts.length > 0) {
        setIsConnected(true);
        setAccount(accounts[0]);

        // Check network
        const networkId = await providerService.getNetworkId();
        setIsValidNetwork(providerService.isValidNetwork(networkId));
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      message.error('Failed to connect wallet: ' + error.message);
      setLoading(false);
    }
  };

  // Handle network switching
  const handleSwitchNetwork = async () => {
    try {
      setLoading(true);
      await providerService.switchToValidNetwork();
      const networkId = await providerService.getNetworkId();
      setIsValidNetwork(providerService.isValidNetwork(networkId));
      setLoading(false);

      if (providerService.isValidNetwork(networkId)) {
        message.success('Successfully switched to a supported network');
        refreshData();
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      message.error('Failed to switch network: ' + error.message);
      setLoading(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    if (!isConnected || !isValidNetwork) return;

    try {
      setLoading(true);
      if (activeTab === 'myData' || activeTab === 'publicData') {
        await fetchUserDatasets();
        await fetchPublicDatasets();
      }
      setLoading(false);
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Failed to refresh data:', error);
      message.error('Failed to refresh data: ' + error.message);
      setLoading(false);
    }
  };

  // Handle upload success
  const handleUploadSuccess = () => {
    message.success('Dataset uploaded successfully!');
    refreshData();
    setActiveTab('myData');
  };

  // Handle dataset selection
  const handleDatasetSelect = (dataset) => {
    setSelectedDataset(dataset);
    // You can optionally view details here
    // handleViewDetails(dataset.id);
  };

  // Handle view dataset details
  const handleViewDetails = async (datasetId) => {
    try {
      setLoading(true);
      const details = await fetchDatasetDetails(datasetId);
      setDatasetDetails(details);
      setShowDetailsModal(true);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dataset details:', error);
      message.error('Failed to fetch dataset details: ' + error.message);
      setLoading(false);
    }
  };

  // Download dataset
  const handleDownload = async (datasetId) => {
    try {
      setLoading(true);
      await downloadDataset(datasetId);
      message.success('Dataset download started');
      setLoading(false);
    } catch (error) {
      console.error('Failed to download dataset:', error);
      message.error('Failed to download dataset: ' + error.message);
      setLoading(false);
    }
  };

  // Handle sharing dataset
  const handleShare = (dataset) => {
    setSelectedDataset(dataset);
    setShareAddress('');
    setShowShareModal(true);
  };

  // Submit share action
  const handleShareSubmit = async () => {
    if (!selectedDataset || !shareAddress) return;

    try {
      setLoading(true);
      await grantAccess(selectedDataset.id, shareAddress);
      message.success(`Dataset shared successfully with ${shareAddress}`);
      setShowShareModal(false);
      refreshData();
      setLoading(false);
    } catch (error) {
      console.error('Failed to share dataset:', error);
      message.error('Failed to share dataset: ' + error.message);
      setLoading(false);
    }
  };

  // Render wallet connection prompt
  const renderWalletPrompt = () => (
    <Card style={{ textAlign: 'center', padding: '30px' }}>
      <Space direction="vertical" size="large">
        <Title level={4}>Connect wallet to manage your datasets</Title>
        <Paragraph>
          Connect your Ethereum wallet to upload, manage and share your datasets
        </Paragraph>
        <Button
          type="primary"
          size="large"
          onClick={handleConnect}
          icon={<UserOutlined />}
          loading={loading}
        >
          Connect Wallet
        </Button>
      </Space>
    </Card>
  );

  // Render network validation prompt
  const renderNetworkPrompt = () => (
    <Card style={{ textAlign: 'center', padding: '30px' }}>
      <Space direction="vertical" size="large">
        <Alert
          message="Network not supported"
          description={`Please switch to a supported network to continue`}
          type="warning"
          showIcon
        />
        <Button
          type="primary"
          onClick={handleSwitchNetwork}
          loading={loading}
        >
          Switch to Supported Network
        </Button>
      </Space>
    </Card>
  );

  // Render main content
  const renderMainContent = () => (
    <Spin spinning={loading || datasetLoading}>
      <Card>
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <DatabaseOutlined />
                My Datasets
              </span>
            }
            key="myData"
          >
            <DataBrowser
              onSelectDataset={handleDatasetSelect}
              showPublicOnly={false}
            />
          </TabPane>
          <TabPane
            tab={
              <span>
                <CloudUploadOutlined />
                Upload Data
              </span>
            }
            key="upload"
          >
            <DataUpload onUploadSuccess={handleUploadSuccess} />
          </TabPane>
          <TabPane
            tab={
              <span>
                <GlobalOutlined />
                Public Datasets
              </span>
            }
            key="publicData"
          >
            <DataBrowser
              onSelectDataset={handleDatasetSelect}
              showPublicOnly={true}
            />
          </TabPane>
        </Tabs>
      </Card>
    </Spin>
  );

  // Render content based on wallet state
  const renderContent = () => {
    if (!isConnected) {
      return renderWalletPrompt();
    } else if (!isValidNetwork) {
      return renderNetworkPrompt();
    } else {
      return renderMainContent();
    }
  };

  return (
    <div className="data-page">
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card>
            <Row>
              <Col span={12}>
                <Title level={2}>
                  <DatabaseOutlined /> Data Management
                </Title>
                <Paragraph>
                  Manage your datasets here. You can upload new data, browse existing datasets, share datasets, or download data shared by others.
                </Paragraph>
              </Col>
              <Col span={12} style={{ textAlign: 'right' }}>
                <Space>
                  {isConnected && (
                    <Text>
                      Connected: <Tag color="green">{formatAddress(account)}</Tag>
                    </Text>
                  )}
                  <Button
                    onClick={refreshData}
                    disabled={!isConnected || !isValidNetwork}
                    loading={loading}
                  >
                    Refresh Data
                  </Button>
                </Space>
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={24}>
          {renderContent()}
        </Col>
      </Row>

      {/* Dataset details modal */}
      <Modal
        title="Dataset Details"
        visible={showDetailsModal}
        onCancel={() => setShowDetailsModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => {
              handleDownload(datasetDetails.id);
              setShowDetailsModal(false);
            }}
          >
            Download
          </Button>
        ]}
        width={700}
      >
        {datasetDetails && (
          <div>
            <Paragraph>
              <strong>Name:</strong> {datasetDetails.name}
            </Paragraph>
            <Paragraph>
              <strong>Description:</strong> {datasetDetails.description}
            </Paragraph>
            <Paragraph>
              <strong>Owner:</strong> {formatAddress(datasetDetails.owner)}
            </Paragraph>
            <Paragraph>
              <strong>Size:</strong> {datasetDetails.size} bytes
            </Paragraph>
            <Paragraph>
              <strong>File Count:</strong> {datasetDetails.fileCount}
            </Paragraph>
            <Paragraph>
              <strong>Encryption Status:</strong> {' '}
              {datasetDetails.isEncrypted ? (
                <Tag icon={<LockOutlined />} color="gold">Encrypted</Tag>
              ) : (
                <Tag color="green">Not Encrypted</Tag>
              )}
            </Paragraph>
            <Paragraph>
              <strong>Access Control:</strong> {' '}
              {datasetDetails.isPublic ? (
                <Tag icon={<TeamOutlined />} color="blue">Public</Tag>
              ) : (
                <Tag color="volcano">Private</Tag>
              )}
            </Paragraph>
            <Paragraph>
              <strong>Tags:</strong>{' '}
              {datasetDetails.tags.map(tag => (
                <Tag key={tag} color="blue">{tag}</Tag>
              ))}
            </Paragraph>
          </div>
        )}
      </Modal>

      {/* Share dataset modal */}
      <Modal
        title={<Space><ShareAltOutlined /> Share Dataset</Space>}
        visible={showShareModal}
        onCancel={() => setShowShareModal(false)}
        onOk={handleShareSubmit}
        okButtonProps={{ disabled: !shareAddress }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          {selectedDataset && (
            <Alert
              message={`You are sharing: ${selectedDataset.name}`}
              type="info"
              showIcon
            />
          )}
          <Paragraph>Please enter the Ethereum address to share with:</Paragraph>
          <Input
            placeholder="0x..."
            value={shareAddress}
            onChange={e => setShareAddress(e.target.value)}
            style={{ width: '100%' }}
          />

          {selectedDataset && selectedDataset.isEncrypted && (
            <Alert
              message="Note: This dataset is encrypted"
              description="The recipient will need an encryption key to decrypt the data. You can share the key through a secure channel."
              type="warning"
              showIcon
            />
          )}
        </Space>
      </Modal>
    </div>
  );
};

export default DataPage;
