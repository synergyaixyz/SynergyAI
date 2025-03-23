/**
 * Data Upload Component
 *
 * Provides user interface for uploading datasets, supporting file uploads, metadata editing, and access control settings
 */

import React, { useState, useEffect } from 'react';
import {
  Form, Input, Button, Upload, Switch, Tag, Select, Card, Steps,
  Row, Col, Typography, message, Progress, Space, Divider, Alert
} from 'antd';
import {
  InboxOutlined, TagOutlined, PlusOutlined, LockOutlined,
  UnlockOutlined, ShareAltOutlined, KeyOutlined, CloudUploadOutlined
} from '@ant-design/icons';
import { ethers } from 'ethers';
import { useDataset } from '../hooks/useDataset';
import { generateRandomKey } from '../utils/encryption';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Dragger } = Upload;
const { Step } = Steps;

const DataUpload = ({ onUploadSuccess }) => {
  // Use dataset hook
  const { uploadDataset, loadingState } = useDataset();

  // State management
  const [fileList, setFileList] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();

  // Tag management
  const [tags, setTags] = useState([]);
  const [inputTag, setInputTag] = useState('');

  // Access control
  const [isPublic, setIsPublic] = useState(false);
  const [isEncrypted, setIsEncrypted] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');
  const [accessAddresses, setAccessAddresses] = useState([]);
  const [inputAddress, setInputAddress] = useState('');

  // Generate random encryption key
  useEffect(() => {
    if (isEncrypted && !encryptionKey) {
      setEncryptionKey(generateRandomKey());
    }
  }, [isEncrypted, encryptionKey]);

  // Handle file upload
  const handleFileChange = ({ fileList }) => {
    setFileList(fileList);
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tag) => {
    setTags(tags.filter(t => t !== tag));
  };

  // Handle address addition
  const handleAddAddress = () => {
    if (!ethers.utils.isAddress(inputAddress)) {
      message.error('Please enter a valid Ethereum address');
      return;
    }

    if (!accessAddresses.includes(inputAddress)) {
      setAccessAddresses([...accessAddresses, inputAddress]);
      setInputAddress('');
    }
  };

  // Handle address removal
  const handleRemoveAddress = (address) => {
    setAccessAddresses(accessAddresses.filter(a => a !== address));
  };

  // Next step
  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        await form.validateFields(['name', 'description']);
      } else if (currentStep === 1 && fileList.length === 0) {
        message.error('Please upload at least one file');
        return;
      }

      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  // Previous step
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  // Submit upload
  const handleSubmit = async () => {
    try {
      await form.validateFields();

      if (fileList.length === 0) {
        message.error('Please upload at least one file');
        return;
      }

      const values = form.getFieldsValue();

      const datasetInfo = {
        name: values.name,
        description: values.description,
        tags: tags,
        isPublic: isPublic,
        isEncrypted: isEncrypted,
        encryptionKey: isEncrypted ? encryptionKey : null,
        accessAddresses: accessAddresses,
        files: fileList.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type,
          originFileObj: file.originFileObj
        }))
      };

      // Upload dataset
      const result = await uploadDataset(datasetInfo, progress => {
        setUploadProgress(progress);
      });

      if (result.success) {
        message.success('Dataset uploaded successfully');

        // Reset form
        form.resetFields();
        setFileList([]);
        setTags([]);
        setIsPublic(false);
        setIsEncrypted(false);
        setEncryptionKey('');
        setAccessAddresses([]);
        setCurrentStep(0);
        setUploadProgress(0);

        // Notify parent component
        if (onUploadSuccess) {
          onUploadSuccess(result.datasetId);
        }
      } else {
        message.error('Upload failed: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Form submission failed:', error);
      message.error('Upload failed: ' + (error.message || 'Unknown error'));
    }
  };

  // Render basic information form
  const renderBasicInfoForm = () => (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        name: '',
        description: ''
      }}
    >
      <Form.Item
        name="name"
        label="Dataset Name"
        rules={[{ required: true, message: 'Please enter dataset name' }]}
      >
        <Input placeholder="For example: Financial Transaction Dataset" />
      </Form.Item>

      <Form.Item
        name="description"
        label="Dataset Description"
        rules={[{ required: true, message: 'Please enter dataset description' }]}
      >
        <TextArea
          placeholder="Describe the content, purpose, and format of the dataset..."
          autoSize={{ minRows: 3, maxRows: 6 }}
        />
      </Form.Item>

      <Form.Item label="Tags">
        <Space style={{ marginBottom: 8 }}>
          <Input
            placeholder="Add tag"
            value={inputTag}
            onChange={e => setInputTag(e.target.value)}
            onPressEnter={handleAddTag}
            prefix={<TagOutlined />}
          />
          <Button type="primary" onClick={handleAddTag} icon={<PlusOutlined />}>
            Add
          </Button>
        </Space>
        <div style={{ marginTop: 8 }}>
          {tags.map(tag => (
            <Tag
              key={tag}
              closable
              onClose={() => handleRemoveTag(tag)}
              style={{ marginBottom: 8 }}
            >
              {tag}
            </Tag>
          ))}
          {tags.length === 0 && (
            <Text type="secondary">Add tags for easier search and classification</Text>
          )}
        </div>
      </Form.Item>
    </Form>
  );

  // Render file upload interface
  const renderFileUpload = () => (
    <div>
      <Dragger
        multiple
        fileList={fileList}
        onChange={handleFileChange}
        beforeUpload={() => false}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag files here to upload</p>
        <p className="ant-upload-hint">
          Support single or batch uploads. Please pay attention to data privacy and security
        </p>
      </Dragger>

      <div style={{ marginTop: 16 }}>
        {fileList.length > 0 ? (
          <Text>Selected {fileList.length} files</Text>
        ) : (
          <Alert
            message="Please select at least one file"
            type="info"
            showIcon
          />
        )}
      </div>
    </div>
  );

  // Render access control settings
  const renderAccessControl = () => (
    <div>
      <Card title="Access Control Settings" style={{ marginBottom: 16 }}>
        <Form.Item label="Dataset Visibility">
          <Switch
            checked={isPublic}
            onChange={setIsPublic}
            checkedChildren="Public"
            unCheckedChildren="Private"
          />
          <Text style={{ marginLeft: 16 }}>
            {isPublic ? 'Everyone can see' : 'Only you and authorized users can see'}
          </Text>
        </Form.Item>

        <Form.Item label="Data Encryption">
          <Switch
            checked={isEncrypted}
            onChange={setIsEncrypted}
            checkedChildren={<KeyOutlined />}
            unCheckedChildren={<UnlockOutlined />}
          />
          <Text style={{ marginLeft: 16 }}>
            {isEncrypted ? 'Data will be encrypted' : 'Data is not encrypted'}
          </Text>
        </Form.Item>

        {isEncrypted && (
          <Form.Item label="Encryption Key">
            <Input.Password
              value={encryptionKey}
              onChange={e => setEncryptionKey(e.target.value)}
              addonAfter={
                <Button
                  type="link"
                  size="small"
                  onClick={() => setEncryptionKey(generateRandomKey())}
                  style={{ padding: 0 }}
                >
                  Generate New Key
                </Button>
              }
            />
            <Text type="warning" style={{ display: 'block', marginTop: 8 }}>
              Please keep this key safe! Losing it will make it impossible to recover data
            </Text>
          </Form.Item>
        )}
      </Card>

      <Card title="Sharing Settings">
        <Space style={{ marginBottom: 8, width: '100%' }}>
          <Input
            placeholder="Enter Ethereum address"
            value={inputAddress}
            onChange={e => setInputAddress(e.target.value)}
            prefix={<ShareAltOutlined />}
            onPressEnter={handleAddAddress}
          />
          <Button type="primary" onClick={handleAddAddress} icon={<PlusOutlined />}>
            Add
          </Button>
        </Space>

        <div style={{ marginTop: 16 }}>
          {accessAddresses.map(address => (
            <Tag
              key={address}
              closable
              onClose={() => handleRemoveAddress(address)}
              style={{ marginBottom: 8 }}
            >
              {address.substr(0, 6)}...{address.substr(address.length - 4)}
            </Tag>
          ))}
          {accessAddresses.length === 0 && (
            <Text type="secondary">Add user addresses to share this dataset</Text>
          )}
        </div>
      </Card>
    </div>
  );

  // Render confirmation interface
  const renderConfirmation = () => (
    <div>
      <Card title="Dataset Information Confirmation" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Text strong>Name:</Text> {form.getFieldValue('name')}
          </Col>
          <Col span={12}>
            <Text strong>File Count:</Text> {fileList.length}
          </Col>

          <Col span={24}>
            <Text strong>Description:</Text>
            <Paragraph>{form.getFieldValue('description')}</Paragraph>
          </Col>

          <Col span={12}>
            <Text strong>Visibility:</Text> {isPublic ? 'Public' : 'Private'}
          </Col>
          <Col span={12}>
            <Text strong>Encryption:</Text> {isEncrypted ? 'Yes' : 'No'}
          </Col>

          <Col span={24}>
            <Text strong>Tags:</Text>
            <div style={{ marginTop: 8 }}>
              {tags.map(tag => (
                <Tag key={tag}>{tag}</Tag>
              ))}
              {tags.length === 0 && <Text type="secondary">No tags</Text>}
            </div>
          </Col>

          {accessAddresses.length > 0 && (
            <Col span={24}>
              <Text strong>Shared Users:</Text>
              <div style={{ marginTop: 8 }}>
                {accessAddresses.map(address => (
                  <Tag key={address}>
                    {address.substr(0, 6)}...{address.substr(address.length - 4)}
                  </Tag>
                ))}
              </div>
            </Col>
          )}
        </Row>
      </Card>

      {uploadProgress > 0 && (
        <div style={{ marginTop: 16 }}>
          <Progress percent={uploadProgress} status="active" />
        </div>
      )}
    </div>
  );

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderBasicInfoForm();
      case 1:
        return renderFileUpload();
      case 2:
        return renderAccessControl();
      case 3:
        return renderConfirmation();
      default:
        return null;
    }
  };

  return (
    <div className="data-upload">
      <Card>
        <Steps current={currentStep} style={{ marginBottom: 24 }}>
          <Step title="Basic Information" description="Dataset Name and Description" />
          <Step title="File Upload" description="Select Files to Upload" />
          <Step title="Access Control" description="Permissions and Encryption Settings" />
          <Step title="Confirm Submission" description="Upload to Chain" />
        </Steps>

        <div className="step-content" style={{ marginTop: 24, minHeight: 300 }}>
          {renderStepContent()}
        </div>

        <Divider />

        <div className="step-actions" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0 || loadingState.loading}
          >
            Previous Step
          </Button>

          <div>
            {currentStep < 3 ? (
              <Button type="primary" onClick={handleNext}>
                Next Step
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                onClick={handleSubmit}
                loading={loadingState.loading}
                disabled={uploadProgress > 0 && uploadProgress < 100}
              >
                Upload Dataset
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DataUpload;
