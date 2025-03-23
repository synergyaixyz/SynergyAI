/**
 * AccessControlPanel Component
 * Manages dataset access permissions, allowing users to add, remove,
 * or modify access levels for collaborators
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  List,
  Button,
  Typography,
  Space,
  Tag,
  Select,
  Input,
  Modal,
  Tooltip,
  Avatar,
  Divider,
  message,
  Spin,
  Empty
} from 'antd';
import {
  UserAddOutlined,
  DeleteOutlined,
  EditOutlined,
  QuestionCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useWallet } from '../hooks/useWallet';
import { truncateString, formatDate } from '../utils/formatting';
import { ethers } from 'ethers';
import {
  updateAccessControl,
  grantAccess,
  revokeAccess,
  checkAccess,
  getDatasetMetadata
} from '../blockchain/contracts/DataVault';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

// Enum for access levels
const ACCESS_LEVELS = {
  NONE: 0,
  READ: 1,
  MODIFY: 2,
  ADMIN: 3
};

const AccessControlPanel = ({ datasetId, refreshDataset, isOwner = false }) => {
  const { account, networkId, signer, provider } = useWallet();
  const [loading, setLoading] = useState(true);
  const [accessList, setAccessList] = useState([]);
  const [currentAccess, setCurrentAccess] = useState(ACCESS_LEVELS.NONE);
  const [datasetMetadata, setDatasetMetadata] = useState(null);
  const [addUserModalVisible, setAddUserModalVisible] = useState(false);
  const [newUserAddress, setNewUserAddress] = useState('');
  const [newUserAccessLevel, setNewUserAccessLevel] = useState(ACCESS_LEVELS.READ);
  const [processingAction, setProcessingAction] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    if (datasetId && account && (provider || signer) && networkId) {
      fetchAccessData();
    }
  }, [datasetId, account, provider, signer, networkId]);

  const fetchAccessData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get metadata for the dataset
      const metadata = await getDatasetMetadata(
        provider || signer,
        networkId,
        datasetId
      );
      setDatasetMetadata(metadata);

      // Check current user's access level
      const currentUserAccess = await checkAccess(
        provider || signer,
        networkId,
        datasetId,
        account
      );
      setCurrentAccess(currentUserAccess);

      // Get access list from metadata if we have admin rights
      if (currentUserAccess >= ACCESS_LEVELS.ADMIN) {
        // Parse metadata to get access control list
        // This is a simplified approach; in a real implementation,
        // you would likely have a dedicated API endpoint to get the access list
        const accessControlData = JSON.parse(metadata.accessControlList || '{}');

        // Format access list
        const formattedList = [
          // Owner is always the first in the list with admin rights
          {
            address: accessControlData.owner,
            accessLevel: ACCESS_LEVELS.ADMIN,
            isOwner: true,
            addedAt: metadata.uploadedAt || new Date().toISOString()
          },
          // Add collaborators
          ...(accessControlData.collaborators || []).map(collaborator => ({
            address: collaborator.address,
            accessLevel: collaborator.accessLevel,
            isOwner: false,
            addedAt: collaborator.addedAt || new Date().toISOString()
          }))
        ];

        setAccessList(formattedList);
      } else {
        // If we don't have admin rights, just show our own access
        setAccessList([
          {
            address: account,
            accessLevel: currentUserAccess,
            isOwner: false,
            addedAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching access data:', error);
      setError('Failed to fetch access control data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    // Validate address
    if (!newUserAddress || !ethers.utils.isAddress(newUserAddress)) {
      message.error('Please enter a valid Ethereum address');
      return;
    }

    // Check if user already has access
    if (accessList.some(item => item.address.toLowerCase() === newUserAddress.toLowerCase())) {
      message.error('This address already has access to the dataset');
      return;
    }

    setProcessingAction(true);

    try {
      // Grant access to the user
      await grantAccess(
        signer,
        networkId,
        datasetId,
        newUserAddress,
        newUserAccessLevel
      );

      message.success(`Access granted to ${truncateString(newUserAddress, 6, 4)}`);

      // Add user to local state
      setAccessList([
        ...accessList,
        {
          address: newUserAddress,
          accessLevel: newUserAccessLevel,
          isOwner: false,
          addedAt: new Date().toISOString()
        }
      ]);

      // Close modal and reset form
      setAddUserModalVisible(false);
      setNewUserAddress('');
      setNewUserAccessLevel(ACCESS_LEVELS.READ);

      // Refresh dataset data
      if (refreshDataset) {
        refreshDataset();
      }
    } catch (error) {
      console.error('Error granting access:', error);
      message.error('Failed to grant access. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRevokeAccess = async (address) => {
    // Prevent revoking access from owner or self
    if (accessList.find(item => item.address === address && item.isOwner)) {
      message.error('Cannot revoke access from the dataset owner');
      return;
    }

    if (address === account) {
      message.error('Cannot revoke your own access');
      return;
    }

    setProcessingAction(true);

    try {
      // Revoke access
      await revokeAccess(
        signer,
        networkId,
        datasetId,
        address
      );

      message.success(`Access revoked from ${truncateString(address, 6, 4)}`);

      // Update local state
      setAccessList(accessList.filter(item => item.address !== address));

      // Refresh dataset data
      if (refreshDataset) {
        refreshDataset();
      }
    } catch (error) {
      console.error('Error revoking access:', error);
      message.error('Failed to revoke access. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleUpdateAccessLevel = async (address, newLevel) => {
    // Prevent changing access level of owner
    if (accessList.find(item => item.address === address && item.isOwner)) {
      message.error('Cannot change access level of the dataset owner');
      return;
    }

    setProcessingAction(true);

    try {
      // First revoke access
      await revokeAccess(
        signer,
        networkId,
        datasetId,
        address
      );

      // Then grant access with new level
      await grantAccess(
        signer,
        networkId,
        datasetId,
        address,
        newLevel
      );

      message.success(`Access level updated for ${truncateString(address, 6, 4)}`);

      // Update local state
      setAccessList(
        accessList.map(item =>
          item.address === address
            ? { ...item, accessLevel: newLevel }
            : item
        )
      );

      // Refresh dataset data
      if (refreshDataset) {
        refreshDataset();
      }
    } catch (error) {
      console.error('Error updating access level:', error);
      message.error('Failed to update access level. Please try again.');
    } finally {
      setProcessingAction(false);
    }
  };

  const renderAccessLevelTag = (level) => {
    switch (level) {
      case ACCESS_LEVELS.READ:
        return <Tag color="blue">Read</Tag>;
      case ACCESS_LEVELS.MODIFY:
        return <Tag color="green">Modify</Tag>;
      case ACCESS_LEVELS.ADMIN:
        return <Tag color="gold">Admin</Tag>;
      default:
        return <Tag>Unknown</Tag>;
    }
  };

  // Check if user has admin rights
  const hasAdminRights = currentAccess >= ACCESS_LEVELS.ADMIN;

  return (
    <Card
      title={
        <Space>
          <LockOutlined />
          <span>Access Control</span>
        </Space>
      }
      extra={
        hasAdminRights && (
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setAddUserModalVisible(true)}
            disabled={processingAction}
          >
            Add User
          </Button>
        )
      }
      className="access-control-panel"
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
          <p>Loading access control data...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="danger">{error}</Text>
          <Button
            onClick={fetchAccessData}
            style={{ marginTop: '10px' }}
          >
            Retry
          </Button>
        </div>
      ) : (
        <>
          {accessList.length === 0 ? (
            <Empty description="No access control data available" />
          ) : (
            <List
              dataSource={accessList}
              renderItem={item => (
                <List.Item
                  actions={
                    hasAdminRights && !item.isOwner
                      ? [
                          <Select
                            value={item.accessLevel}
                            onChange={(value) => handleUpdateAccessLevel(item.address, value)}
                            disabled={processingAction}
                            style={{ width: 100 }}
                          >
                            <Option value={ACCESS_LEVELS.READ}>Read</Option>
                            <Option value={ACCESS_LEVELS.MODIFY}>Modify</Option>
                            <Option value={ACCESS_LEVELS.ADMIN}>Admin</Option>
                          </Select>,
                          <Button
                            icon={<DeleteOutlined />}
                            danger
                            size="small"
                            onClick={() => handleRevokeAccess(item.address)}
                            disabled={processingAction || item.address === account}
                          />
                        ]
                      : []
                  }
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{
                          backgroundColor: item.isOwner ? '#722ed1' : '#1890ff',
                          verticalAlign: 'middle'
                        }}
                      >
                        {item.address.substr(2, 2).toUpperCase()}
                      </Avatar>
                    }
                    title={
                      <Space>
                        {renderAccessLevelTag(item.accessLevel)}
                        <Tooltip title={item.address}>
                          <Text>{truncateString(item.address, 8, 6)}</Text>
                        </Tooltip>
                        {item.isOwner && <Tag color="purple">Owner</Tag>}
                        {item.address === account && <Tag color="cyan">You</Tag>}
                      </Space>
                    }
                    description={`Added: ${formatDate(new Date(item.addedAt))}`}
                  />
                </List.Item>
              )}
            />
          )}

          {/* Access level explanation */}
          <Divider orientation="left">
            <Space>
              <InfoCircleOutlined />
              <span>Access Level Information</span>
            </Space>
          </Divider>

          <List size="small">
            <List.Item>
              <Space>
                <Tag color="blue">Read</Tag>
                <Text>Can view and download dataset files</Text>
              </Space>
            </List.Item>
            <List.Item>
              <Space>
                <Tag color="green">Modify</Tag>
                <Text>Can update dataset files and metadata</Text>
              </Space>
            </List.Item>
            <List.Item>
              <Space>
                <Tag color="gold">Admin</Tag>
                <Text>Can manage access control and transfer ownership</Text>
              </Space>
            </List.Item>
          </List>
        </>
      )}

      {/* Modal for adding new users */}
      <Modal
        title="Add User Access"
        visible={addUserModalVisible}
        onOk={handleAddUser}
        onCancel={() => {
          setAddUserModalVisible(false);
          setNewUserAddress('');
          setNewUserAccessLevel(ACCESS_LEVELS.READ);
        }}
        confirmLoading={processingAction}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Enter the Ethereum address of the user to grant access:</Text>
          <Input
            placeholder="0x..."
            value={newUserAddress}
            onChange={(e) => setNewUserAddress(e.target.value)}
            disabled={processingAction}
          />

          <Text>Select access level:</Text>
          <Select
            value={newUserAccessLevel}
            onChange={setNewUserAccessLevel}
            style={{ width: '100%' }}
            disabled={processingAction}
          >
            <Option value={ACCESS_LEVELS.READ}>
              <Space>
                <Tag color="blue">Read</Tag>
                <Text>View and download only</Text>
              </Space>
            </Option>
            <Option value={ACCESS_LEVELS.MODIFY}>
              <Space>
                <Tag color="green">Modify</Tag>
                <Text>Can update dataset</Text>
              </Space>
            </Option>
            <Option value={ACCESS_LEVELS.ADMIN}>
              <Space>
                <Tag color="gold">Admin</Tag>
                <Text>Full access control</Text>
              </Space>
            </Option>
          </Select>
        </Space>
      </Modal>
    </Card>
  );
};

export default AccessControlPanel;
