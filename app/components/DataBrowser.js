import React, { useState, useEffect } from 'react';
import {
  Table, Card, Tag, Space, Button, Input, Select,
  Spin, Empty, Modal, Tabs, Descriptions, Tooltip,
  message, Typography, Divider, Skeleton, Badge, Alert
} from 'antd';
import {
  CloudDownloadOutlined, EyeOutlined, ShareAltOutlined,
  LockOutlined, UnlockOutlined, DeleteOutlined,
  SearchOutlined, SyncOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, FileOutlined, FileImageOutlined,
  FileTextOutlined, FileZipOutlined, FileExcelOutlined,
  FileCodeOutlined, FileMarkdownOutlined, FileUnknownOutlined,
  DatabaseOutlined, FileAddOutlined, AudioOutlined,
  VideoCameraOutlined, SafetyOutlined
} from '@ant-design/icons';
import useDataset from '../hooks/useDataset';
import { formatFileSize, formatDateReadable, getFileTypeDetails } from '../utils/formatting';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;

/**
 * DataBrowser Component
 *
 * Provides an interface for browsing and managing datasets stored in blockchain.
 */
const DataBrowser = ({ onSelectDataset, userOnly = false }) => {
  // Use the dataset hook
  const {
    userDatasets,
    publicDatasets,
    loading,
    error,
    refreshDatasets,
    fetchDatasetDetails,
    downloadDataset,
    shareDataset,
    deleteDataset,
    updateDatasetAccess,
    account
  } = useDataset();

  // Local state
  const [datasets, setDatasets] = useState([]);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [datasetType, setDatasetType] = useState(userOnly ? 'my' : 'all');
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [sharingVisible, setSharingVisible] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');

  // Update datasets when userDatasets or publicDatasets change
  useEffect(() => {
    const allDatasets = [];

    if (datasetType === 'my' || datasetType === 'all') {
      allDatasets.push(...userDatasets);
    }

    if (datasetType === 'public' || datasetType === 'all') {
      const filteredPublicDatasets = publicDatasets.filter(
        dataset => !userDatasets.some(ud => ud.id === dataset.id)
      );
      allDatasets.push(...filteredPublicDatasets);
    }

    // Filter by search text if specified
    const filteredDatasets = searchText
      ? allDatasets.filter(
          dataset =>
            dataset.name.toLowerCase().includes(searchText.toLowerCase()) ||
            dataset.description.toLowerCase().includes(searchText.toLowerCase()) ||
            (dataset.tags && dataset.tags.some(tag =>
              tag.toLowerCase().includes(searchText.toLowerCase())
            ))
        )
      : allDatasets;

    setDatasets(filteredDatasets);
  }, [userDatasets, publicDatasets, datasetType, searchText]);

  // Get dataset status properties
  const getDatasetStatus = (dataset) => {
    if (dataset.isEncrypted) {
      return {
        color: 'blue',
        text: 'Encrypted',
        icon: <LockOutlined />
      };
    } else if (dataset.isPublic) {
      return {
        color: 'green',
        text: 'Public',
        icon: <UnlockOutlined />
      };
    } else {
      return {
        color: 'orange',
        text: 'Private',
        icon: <LockOutlined />
      };
    }
  };

  // View dataset details
  const handleViewDetails = async (dataset) => {
    try {
      setLoadingAction(true);
      const details = await fetchDatasetDetails(dataset.id);
      setSelectedDataset(details);
      setDetailsVisible(true);
    } catch (error) {
      message.error('Failed to load dataset details');
      console.error('Error loading dataset details:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  // Download dataset
  const handleDownload = async (dataset) => {
    try {
      setLoadingAction(true);
      await downloadDataset(dataset.id);
      message.success('Dataset downloaded successfully');
    } catch (error) {
      message.error('Failed to download dataset');
      console.error('Error downloading dataset:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  // Share dataset modal
  const handleShareModal = (dataset) => {
    setSelectedDataset(dataset);
    setRecipientAddress('');
    setSharingVisible(true);
  };

  // Share dataset with another user
  const handleShare = async () => {
    if (!recipientAddress || !selectedDataset) return;

    try {
      setLoadingAction(true);
      await shareDataset(selectedDataset.id, recipientAddress);
      message.success('Dataset shared successfully');
      setSharingVisible(false);
    } catch (error) {
      message.error('Failed to share dataset');
      console.error('Error sharing dataset:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  // Toggle dataset public/private status
  const handleToggleAccess = async (dataset) => {
    try {
      setLoadingAction(true);
      await updateDatasetAccess(dataset.id, !dataset.isPublic);
      message.success(`Dataset is now ${!dataset.isPublic ? 'public' : 'private'}`);
      refreshDatasets();
    } catch (error) {
      message.error('Failed to update dataset access');
      console.error('Error updating dataset access:', error);
    } finally {
      setLoadingAction(false);
    }
  };

  // Delete dataset with confirmation
  const handleDeleteConfirm = (dataset) => {
    confirm({
      title: 'Delete Dataset',
      icon: <ExclamationCircleOutlined />,
      content: 'Are you sure you want to delete this dataset? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoadingAction(true);
          await deleteDataset(dataset.id);
          message.success('Dataset deleted successfully');
          refreshDatasets();
        } catch (error) {
          message.error('Failed to delete dataset');
          console.error('Error deleting dataset:', error);
        } finally {
          setLoadingAction(false);
        }
      }
    });
  };

  // Select a dataset
  const handleSelect = (dataset) => {
    setSelectedDataset(dataset);
    if (onSelectDataset) {
      onSelectDataset(dataset);
    }
  };

  // Define the table columns
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div>
            {record.tags && record.tags.map(tag => (
              <Tag key={tag} color="blue">{tag}</Tag>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size) => formatFileSize(size),
      width: 120,
    },
    {
      title: 'Files',
      dataIndex: 'fileCount',
      key: 'fileCount',
      width: 80,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => formatDateReadable(date),
      width: 150,
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const status = getDatasetStatus(record);
        return (
          <Tag color={status.color} icon={status.icon}>{status.text}</Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 220,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(record);
            }}
            loading={loadingAction}
          />
          <Button
            type="text"
            icon={<CloudDownloadOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDownload(record);
            }}
            loading={loadingAction}
            disabled={record.isEncrypted && !record.hasAccessKey}
          />
          {record.owner === account && (
            <>
              <Button
                type="text"
                icon={<ShareAltOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleShareModal(record);
                }}
                loading={loadingAction}
              />
              <Button
                type="text"
                icon={record.isPublic ? <LockOutlined /> : <UnlockOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleAccess(record);
                }}
                loading={loadingAction}
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConfirm(record);
                }}
                loading={loadingAction}
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="dataset-browser">
      <Card>
        <div style={{ marginBottom: 16 }}>
          <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Input
                placeholder="Search datasets"
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 250 }}
                allowClear
              />
              {!userOnly && (
                <Select
                  defaultValue={datasetType}
                  onChange={setDatasetType}
                  style={{ width: 150 }}
                >
                  <Option value="all">All Datasets</Option>
                  <Option value="my">My Datasets</Option>
                  <Option value="public">Public Datasets</Option>
                </Select>
              )}
            </Space>
            <Button
              icon={<SyncOutlined />}
              onClick={refreshDatasets}
              loading={loading}
            >
              Refresh
            </Button>
          </Space>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Text type="danger">{error}</Text>
          </div>
        ) : datasets.length > 0 ? (
          <Table
            dataSource={datasets}
            columns={columns}
            rowKey="id"
            size="middle"
            pagination={{ pageSize: 10 }}
            onRow={(record) => ({
              onClick: () => handleSelect(record)
            })}
            loading={loading}
          />
        ) : (
          <Empty description="No datasets found" />
        )}
      </Card>

      {/* Dataset details modal */}
      <Modal
        title="Dataset Details"
        visible={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailsVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedDataset ? (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="ID">{selectedDataset.id}</Descriptions.Item>
              <Descriptions.Item label="Name">{selectedDataset.name}</Descriptions.Item>
              <Descriptions.Item label="Description">{selectedDataset.description}</Descriptions.Item>
              <Descriptions.Item label="Owner">{selectedDataset.owner}</Descriptions.Item>
              <Descriptions.Item label="Size">{formatFileSize(selectedDataset.size)}</Descriptions.Item>
              <Descriptions.Item label="Created">{formatDateReadable(selectedDataset.createdAt, true)}</Descriptions.Item>
              <Descriptions.Item label="Last Modified">{formatDateReadable(selectedDataset.lastModified, true)}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Space>
                  <Tag color={selectedDataset.isPublic ? "green" : "orange"}>
                    {selectedDataset.isPublic ? "Public" : "Private"}
                  </Tag>
                  {selectedDataset.isEncrypted && (
                    <Tag color="blue">Encrypted</Tag>
                  )}
                </Space>
              </Descriptions.Item>
              <Descriptions.Item label="Tags">
                <Space>
                  {selectedDataset.tags?.map(tag => (
                    <Tag key={tag} color="blue">{tag}</Tag>
                  )) || 'No tags'}
                </Space>
              </Descriptions.Item>
            </Descriptions>

            {selectedDataset.files && selectedDataset.files.length > 0 && (
              <>
                <Divider />
                <Title level={5}>Files</Title>
                <Table
                  dataSource={selectedDataset.files}
                  rowKey="name"
                  pagination={false}
                  size="small"
                  columns={[
                    {
                      title: 'File Name',
                      dataIndex: 'name',
                      key: 'name',
                      render: (name, record) => {
                        const fileTypeDetails = getFileTypeDetails(record.type || name);
                        let FileIcon;

                        switch (fileTypeDetails.iconType) {
                          case 'file-image': FileIcon = FileImageOutlined; break;
                          case 'file-text': FileIcon = FileTextOutlined; break;
                          case 'file-audio': FileIcon = AudioOutlined; break;
                          case 'file-video': FileIcon = VideoCameraOutlined; break;
                          case 'file-zip': FileIcon = FileZipOutlined; break;
                          case 'file-code': FileIcon = FileCodeOutlined; break;
                          case 'database': FileIcon = DatabaseOutlined; break;
                          default: FileIcon = FileOutlined;
                        }

                        return (
                          <Space>
                            <FileIcon />
                            <span>{name}</span>
                          </Space>
                        );
                      },
                    },
                    {
                      title: 'Size',
                      dataIndex: 'size',
                      key: 'size',
                      render: (size) => formatFileSize(size),
                      width: 120,
                    },
                    {
                      title: 'Type',
                      dataIndex: 'type',
                      key: 'type',
                      width: 180,
                      render: (type, record) => {
                        const fileTypeDetails = getFileTypeDetails(type || record.name);
                        return (
                          <Tag color="blue">{fileTypeDetails.category}</Tag>
                        );
                      },
                    }
                  ]}
                />
              </>
            )}
          </div>
        ) : (
          <Skeleton active />
        )}
      </Modal>

      {/* Share dataset modal */}
      <Modal
        title="Share Dataset"
        visible={sharingVisible}
        onCancel={() => setSharingVisible(false)}
        onOk={handleShare}
        okButtonProps={{ loading: loadingAction }}
        okText="Share"
      >
        <div style={{ marginBottom: 16 }}>
          <Text>Share "{selectedDataset?.name}" with another user</Text>
        </div>
        <Input
          placeholder="Enter Ethereum address of recipient"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        {selectedDataset?.isEncrypted && (
          <Alert
            message="Encrypted Dataset"
            description="This dataset is encrypted. The recipient will need the encryption key to access the data."
            type="info"
            showIcon
          />
        )}
      </Modal>
    </div>
  );
};

export default DataBrowser;
