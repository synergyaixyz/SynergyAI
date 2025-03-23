/**
 * ComputeTask Component
 * Allows users to create and manage distributed computing tasks
 * using SynergyAI's decentralized computing network
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Select,
  Upload,
  message,
  Progress,
  Space,
  Row,
  Col,
  Divider,
  Typography,
  Tag,
  Tooltip,
  Modal,
  Spin,
  Steps,
  Statistic,
  Alert,
  Descriptions,
  Switch
} from 'antd';
import {
  CloudUploadOutlined,
  CodeOutlined,
  AppstoreOutlined,
  DollarOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  BarChartOutlined,
  FileTextOutlined,
  UploadOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useWallet } from '../hooks/useWallet';
import { ethers } from 'ethers';
import { ComputeManager } from '../blockchain/contracts/ComputeManager';
import { DataVault } from '../blockchain/contracts/DataVault';
import { Tokens } from '../blockchain/contracts/Tokens';
import { formatTokenAmount } from '../utils/formatting';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { Step } = Steps;
const { TextArea } = Input;

// Task status enum
const TASK_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELED: 'canceled',
};

// Task status colors
const STATUS_COLORS = {
  [TASK_STATUS.PENDING]: 'orange',
  [TASK_STATUS.ACCEPTED]: 'blue',
  [TASK_STATUS.RUNNING]: 'geekblue',
  [TASK_STATUS.COMPLETED]: 'green',
  [TASK_STATUS.FAILED]: 'red',
  [TASK_STATUS.CANCELED]: 'gray',
};

// Task status icons
const STATUS_ICONS = {
  [TASK_STATUS.PENDING]: <ClockCircleOutlined />,
  [TASK_STATUS.ACCEPTED]: <CheckCircleOutlined />,
  [TASK_STATUS.RUNNING]: <PlayCircleOutlined spin />,
  [TASK_STATUS.COMPLETED]: <CheckCircleOutlined />,
  [TASK_STATUS.FAILED]: <CloseCircleOutlined />,
  [TASK_STATUS.CANCELED]: <PauseCircleOutlined />,
};

// Predefined task templates
const TASK_TEMPLATES = [
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Analyze datasets using statistical methods',
    codeTemplate: `# Python data analysis template
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler

# Load dataset
def process_data(dataset_path):
    df = pd.read_csv(dataset_path)

    # Perform analysis
    # TODO: Customize analysis based on your needs

    # Return results
    return {
        'summary': df.describe().to_dict(),
        'correlations': df.corr().to_dict(),
        'columns': df.columns.tolist()
    }
`,
    params: {
      cpuCores: 2,
      memoryGB: 4,
      estimatedDuration: 1,
    }
  },
  {
    id: 'ml-training',
    name: 'Machine Learning Training',
    description: 'Train ML models on your datasets',
    codeTemplate: `# Python ML training template
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Load and train model
def train_model(dataset_path):
    # Load data
    df = pd.read_csv(dataset_path)

    # Prepare features and target (modify as needed)
    X = df.drop('target_column', axis=1)
    y = df['target_column']

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    # Train model
    model = RandomForestClassifier(n_estimators=100)
    model.fit(X_train, y_train)

    # Evaluate
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)

    return {
        'accuracy': accuracy,
        'feature_importance': dict(zip(X.columns, model.feature_importances_)),
        'model_params': model.get_params()
    }
`,
    params: {
      cpuCores: 4,
      memoryGB: 8,
      estimatedDuration: 3,
    }
  },
  {
    id: 'image-processing',
    name: 'Image Processing',
    description: 'Process and transform image datasets',
    codeTemplate: `# Python image processing template
import cv2
import numpy as np
import os
from PIL import Image
import json

def process_images(dataset_path):
    # Get list of image files
    image_files = [f for f in os.listdir(dataset_path) if f.endswith(('.png', '.jpg', '.jpeg'))]
    results = []

    for img_file in image_files:
        img_path = os.path.join(dataset_path, img_file)
        img = cv2.imread(img_path)

        # Example processing: resize and get basic stats
        resized = cv2.resize(img, (224, 224))
        avg_color = np.mean(img, axis=(0, 1)).tolist()

        results.append({
            'filename': img_file,
            'dimensions': img.shape,
            'avg_color': avg_color
        })

    return {
        'processed_count': len(results),
        'image_stats': results
    }
`,
    params: {
      cpuCores: 2,
      memoryGB: 4,
      gpuEnabled: true,
      estimatedDuration: 2,
    }
  },
  {
    id: 'custom',
    name: 'Custom Task',
    description: 'Create a fully customized task',
    codeTemplate: `# Custom task template
# Replace with your code

def process_data(input_path):
    # Your custom processing logic here

    # Return results as a dictionary
    return {
        'result': 'Success',
        'details': {}
    }
`,
    params: {
      cpuCores: 2,
      memoryGB: 4,
      estimatedDuration: 1,
    }
  }
];

// Helper function to calculate estimated cost
const calculateEstimatedCost = (cpuCores, memoryGB, gpuEnabled, estimatedDuration) => {
  // These are example rates, would be fetched from the ComputeManager contract in production
  const cpuRatePerHour = 0.05; // AIP tokens per CPU core per hour
  const memoryRatePerHour = 0.02; // AIP tokens per GB per hour
  const gpuRatePerHour = 0.5; // AIP tokens per GPU per hour

  let totalCost = (cpuCores * cpuRatePerHour + memoryGB * memoryRatePerHour) * estimatedDuration;

  if (gpuEnabled) {
    totalCost += gpuRatePerHour * estimatedDuration;
  }

  return totalCost;
};

const ComputeTask = ({
  signer,
  provider,
  account,
  networkId,
  onTaskCreated,
  myDatasets = []
}) => {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [taskCode, setTaskCode] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [cpuCores, setCpuCores] = useState(2);
  const [memoryGB, setMemoryGB] = useState(4);
  const [gpuEnabled, setGpuEnabled] = useState(false);
  const [estimatedDuration, setEstimatedDuration] = useState(1);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [maxBudget, setMaxBudget] = useState(0);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [aipBalance, setAipBalance] = useState(0);
  const [availableProviders, setAvailableProviders] = useState([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Get user AIP token balance
  const fetchAipBalance = async () => {
    if (!signer || !networkId) return;

    try {
      setLoadingBalance(true);
      const tokens = new Tokens(provider);
      const balance = await tokens.getTokenBalance('AIP', account, networkId);
      setAipBalance(parseFloat(ethers.utils.formatEther(balance)));
    } catch (error) {
      console.error('Error fetching AIP balance:', error);
      message.error('Failed to fetch AIP token balance');
    } finally {
      setLoadingBalance(false);
    }
  };

  // Get available compute nodes
  const fetchAvailableProviders = async () => {
    if (!provider || !networkId) return;

    try {
      setLoadingProviders(true);
      const computeManager = new ComputeManager(provider);
      const providers = await computeManager.getAvailableProviders(networkId);
      setAvailableProviders(providers);
    } catch (error) {
      console.error('Error fetching available providers:', error);
      message.error('Failed to fetch available compute providers');
    } finally {
      setLoadingProviders(false);
    }
  };

  // Calculate estimated task cost
  const calculateCost = () => {
    const cost = calculateEstimatedCost(
      cpuCores,
      memoryGB,
      gpuEnabled,
      estimatedDuration
    );
    setEstimatedCost(cost);
    // Set default maximum budget to 1.2 times the estimated cost
    setMaxBudget(cost * 1.2);
  };

  // Initialize
  useEffect(() => {
    // Get AIP balance when account and network ID change
    if (account && networkId) {
      fetchAipBalance();
      fetchAvailableProviders();
    }
  }, [account, networkId]);

  // Recalculate cost when resource specifications change
  useEffect(() => {
    calculateCost();
  }, [cpuCores, memoryGB, gpuEnabled, estimatedDuration]);

  // Handle template selection
  const handleTemplateChange = (value) => {
    const template = TASK_TEMPLATES.find(t => t.id === value);
    setSelectedTemplate(template);
    setTaskCode(template.codeTemplate);
    if (template.params) {
      setCpuCores(template.params.cpuCores || 2);
      setMemoryGB(template.params.memoryGB || 4);
      setGpuEnabled(template.params.gpuEnabled || false);
      setEstimatedDuration(template.params.estimatedDuration || 1);
    }
  };

  // Handle code changes
  const handleCodeChange = (e) => {
    setTaskCode(e.target.value);
  };

  // Upload code files
  const uploadCode = async (file) => {
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTaskCode(e.target.result);
      };
      reader.readAsText(file);
      return false; // Prevent automatic upload
    } catch (error) {
      message.error('Failed to read file');
      return false;
    }
  };

  // Next step
  const nextStep = () => {
    form.validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch(info => {
        console.log('Validate Failed:', info);
      });
  };

  // Previous step
  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Create compute task
  const handleCreateTask = async () => {
    try {
      await form.validateFields();

      if (!signer || !account || !networkId) {
        message.error('Wallet not connected');
        return;
      }

      if (!selectedDataset) {
        message.error('Please select a dataset');
        return;
      }

      if (maxBudget <= 0) {
        message.error('Invalid budget amount');
        return;
      }

      if (aipBalance < maxBudget) {
        message.error('Insufficient AIP token balance');
        return;
      }

      setSubmitLoading(true);

      // 1. First approve token spending
      const tokens = new Tokens(signer);
      const computeManager = new ComputeManager(signer);

      const maxBudgetWei = ethers.utils.parseEther(maxBudget.toString());

      // Get ComputeManager contract address
      const computeManagerAddress = await computeManager.getContractAddress(networkId);

      // Approve token spending
      await tokens.approveTokens(
        'AIP',
        computeManagerAddress,
        maxBudgetWei,
        networkId
      );

      message.info('AIP tokens approved, creating compute task...');

      // 2. Create task requirements object
      const requirements = {
        cpuCores,
        memoryGB,
        gpuEnabled,
        estimatedDuration,
        code: taskCode,
        codeType: 'python' // Default to Python code
      };

      // 3. Create compute task
      const taskReceipt = await computeManager.createTask(
        networkId,
        selectedDataset.id,
        'ANALYSIS', // Task type
        JSON.stringify(requirements),
        maxBudgetWei
      );

      message.success(`Compute task created with ID: ${taskReceipt.taskId}`);

      // Trigger callback
      if (onTaskCreated) {
        onTaskCreated(taskReceipt.taskId);
      }

      // Reset form
      form.resetFields();
      setCurrentStep(0);
      setSelectedTemplate(null);
      setTaskCode('');
      setSelectedDataset(null);
      setCpuCores(2);
      setMemoryGB(4);
      setGpuEnabled(false);
      setEstimatedDuration(1);
      setEstimatedCost(0);
      setMaxBudget(0);

    } catch (error) {
      console.error('Error creating compute task:', error);
      message.error('Failed to create compute task: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Select dataset and task template
        return (
          <div>
            <Form.Item
              name="dataset"
              label="Select Dataset"
              rules={[{ required: true, message: 'Please select a dataset' }]}
            >
              <Select
                placeholder="Select a dataset"
                onChange={(value) => {
                  const dataset = myDatasets.find(d => d.id === value);
                  setSelectedDataset(dataset);
                }}
              >
                {myDatasets.map(dataset => (
                  <Option key={dataset.id} value={dataset.id}>
                    {dataset.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedDataset && (
              <Card size="small" className="mb-4" bordered={false}>
                <Space>
                  <Tag color="blue">{selectedDataset.type}</Tag>
                  <Text type="secondary">Size: {selectedDataset.size}</Text>
                </Space>
                <Paragraph ellipsis={{ rows: 2 }} className="mt-2">
                  {selectedDataset.description}
                </Paragraph>
              </Card>
            )}

            <Form.Item
              name="template"
              label="Task Template"
              rules={[{ required: true, message: 'Please select a task template' }]}
            >
              <Select
                placeholder="Select a task template"
                onChange={handleTemplateChange}
              >
                {TASK_TEMPLATES.map(template => (
                  <Option key={template.id} value={template.id}>
                    {template.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            {selectedTemplate && (
              <Card size="small" className="mb-4" bordered={false}>
                <Paragraph>{selectedTemplate.description}</Paragraph>
              </Card>
            )}
          </div>
        );

      case 1: // Edit task code
        return (
          <div>
            <Form.Item
              name="code"
              label="Task Code"
              rules={[{ required: true, message: 'Task code is required' }]}
            >
              <TextArea
                rows={12}
                value={taskCode}
                onChange={handleCodeChange}
                placeholder="Enter your code here"
              />
            </Form.Item>

            <Upload.Dragger
              name="code-file"
              accept=".py,.js,.r"
              beforeUpload={uploadCode}
              showUploadList={false}
              className="mb-4"
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">Click or drag file to upload code</p>
              <p className="ant-upload-hint">
                Supports Python (.py), JavaScript (.js), or R (.r) files
              </p>
            </Upload.Dragger>
          </div>
        );

      case 2: // Configure resource requirements
        return (
          <div>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="cpuCores"
                  label="CPU Cores"
                  rules={[{ required: true, message: 'CPU cores is required' }]}
                >
                  <Select value={cpuCores} onChange={value => setCpuCores(value)}>
                    <Option value={1}>1 Core</Option>
                    <Option value={2}>2 Cores</Option>
                    <Option value={4}>4 Cores</Option>
                    <Option value={8}>8 Cores</Option>
                    <Option value={16}>16 Cores</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="memoryGB"
                  label="Memory (GB)"
                  rules={[{ required: true, message: 'Memory is required' }]}
                >
                  <Select value={memoryGB} onChange={value => setMemoryGB(value)}>
                    <Option value={2}>2 GB</Option>
                    <Option value={4}>4 GB</Option>
                    <Option value={8}>8 GB</Option>
                    <Option value={16}>16 GB</Option>
                    <Option value={32}>32 GB</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="gpuEnabled" valuePropName="checked">
              <div className="d-flex align-items-center">
                <Switch
                  checked={gpuEnabled}
                  onChange={value => setGpuEnabled(value)}
                />
                <span className="ml-2">Require GPU</span>
              </div>
            </Form.Item>

            <Form.Item
              name="estimatedDuration"
              label="Estimated Duration (hours)"
              rules={[{ required: true, message: 'Duration is required' }]}
            >
              <Select
                value={estimatedDuration}
                onChange={value => setEstimatedDuration(value)}
              >
                <Option value={0.5}>30 minutes</Option>
                <Option value={1}>1 hour</Option>
                <Option value={2}>2 hours</Option>
                <Option value={4}>4 hours</Option>
                <Option value={8}>8 hours</Option>
                <Option value={12}>12 hours</Option>
                <Option value={24}>24 hours</Option>
              </Select>
            </Form.Item>

            <Divider />

            <Card className="mb-4">
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Estimated Cost"
                    value={estimatedCost}
                    precision={2}
                    suffix="AIP"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Available Balance"
                    value={aipBalance}
                    precision={2}
                    suffix="AIP"
                    loading={loadingBalance}
                  />
                </Col>
              </Row>
            </Card>

            <Form.Item
              name="maxBudget"
              label={
                <span>
                  Maximum Budget
                  <Tooltip title="Set a max budget for the task. The actual cost may be lower.">
                    <InfoCircleOutlined style={{ marginLeft: 8 }} />
                  </Tooltip>
                </span>
              }
              rules={[
                { required: true, message: 'Maximum budget is required' },
                {
                  validator: (_, value) => {
                    if (value > 0 && value <= aipBalance) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(value <= 0 ? 'Budget must be greater than 0' : 'Insufficient balance')
                    );
                  }
                }
              ]}
            >
              <Input
                type="number"
                addonAfter="AIP"
                value={maxBudget}
                onChange={e => setMaxBudget(parseFloat(e.target.value))}
                min={estimatedCost}
                max={aipBalance}
              />
            </Form.Item>

            <div className="mt-4">
              <Text type="secondary">
                Available compute providers: {loadingProviders ? <Spin size="small" /> : availableProviders.length}
              </Text>
            </div>
          </div>
        );

      case 3: // Confirm and submit
        return (
          <div>
            <Card title="Task Summary" className="mb-4">
              <Descriptions column={1}>
                <Descriptions.Item label="Dataset">
                  {selectedDataset?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Template">
                  {selectedTemplate?.name}
                </Descriptions.Item>
                <Descriptions.Item label="Resources">
                  {cpuCores} CPU Cores, {memoryGB} GB RAM
                  {gpuEnabled && ', GPU Enabled'}
                </Descriptions.Item>
                <Descriptions.Item label="Estimated Duration">
                  {estimatedDuration} hour(s)
                </Descriptions.Item>
                <Descriptions.Item label="Estimated Cost">
                  {estimatedCost.toFixed(2)} AIP
                </Descriptions.Item>
                <Descriptions.Item label="Maximum Budget">
                  {maxBudget.toFixed(2)} AIP
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Alert
              message="Confirmation"
              description={
                <div>
                  <p>
                    You are about to create a compute task that will be executed on the SynergyAI network.
                    Once submitted, AIP tokens will be reserved as payment for the task.
                  </p>
                  <p>
                    After completion, you will be able to review the results before accepting and finalizing payment.
                  </p>
                </div>
              }
              type="info"
              showIcon
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card title="Create Compute Task" className="compute-task-card">
      <Steps
        current={currentStep}
        items={[
          {
            title: 'Dataset & Template',
            icon: <CloudUploadOutlined />
          },
          {
            title: 'Task Code',
            icon: <CodeOutlined />
          },
          {
            title: 'Resources',
            icon: <SettingOutlined />
          },
          {
            title: 'Confirm',
            icon: <CheckCircleOutlined />
          }
        ]}
      />

      <div className="step-content" style={{ marginTop: 24, marginBottom: 24 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            cpuCores: 2,
            memoryGB: 4,
            gpuEnabled: false,
            estimatedDuration: 1
          }}
        >
          {renderStepContent()}
        </Form>
      </div>

      <div className="steps-action">
        {currentStep > 0 && (
          <Button style={{ marginRight: 8 }} onClick={prevStep}>
            Previous
          </Button>
        )}
        {currentStep < 3 && (
          <Button type="primary" onClick={nextStep}>
            Next
          </Button>
        )}
        {currentStep === 3 && (
          <Button
            type="primary"
            onClick={handleCreateTask}
            loading={submitLoading}
            disabled={!signer || !account || aipBalance < maxBudget}
          >
            Submit Task
          </Button>
        )}
      </div>
    </Card>
  );
};

export default ComputeTask;
