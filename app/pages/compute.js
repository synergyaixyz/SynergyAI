/**
 * Compute Page
 *
 * A page for creating and managing compute tasks,
 * integrating the ComputeTask and TaskList components.
 */

import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, Form, Input, Select, InputNumber, message, Table, Tag, Tabs, Modal, Spin, Descriptions, Collapse, Progress, Typography, Layout, Alert, Skeleton, Divider, Empty } from 'antd';
import { RocketOutlined, CloudServerOutlined, AppstoreOutlined, SettingOutlined, NodeIndexOutlined, PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Web3Context } from '../blockchain/web3Context';
import {
  getComputeCost,
  purchaseCompute,
  registerComputeNode,
  submitComputeTask,
  getUserTasks,
  getAvailableCompute,
  getAvailableNodes
} from '../blockchain/contractHelpers';
import LayoutComponent from '../components/Layout';
import Head from 'next/head';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useRouter } from 'next/router';
import ComputeTask from '../components/ComputeTask';
import TaskList from '../components/TaskList';
import { useWeb3 } from '../context/Web3Context';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;
const { TextArea } = Input;
const { Title, Text } = Typography;
const { Content } = Layout;

const ComputePage = () => {
  const router = useRouter();
  const { tab = 'tasks' } = router.query;
  const { account, isConnected, connectWallet, isNetworkValid, switchNetwork } = useContext(Web3Context);
  const { signer, provider, networkId, chainSupported } = useWeb3();

  // Tabs state
  const [activeTab, setActiveTab] = useState('tasks');

  // Purchase compute resources state
  const [computeType, setComputeType] = useState('cpu');
  const [computeAmount, setComputeAmount] = useState(1);
  const [computeDuration, setComputeDuration] = useState(30);
  const [estimatedCost, setEstimatedCost] = useState(0);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Register node state
  const [nodeType, setNodeType] = useState('cpu');
  const [nodePerformance, setNodePerformance] = useState(1);
  const [nodeSpecs, setNodeSpecs] = useState('');
  const [nodeApiUrl, setNodeApiUrl] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Submit task state
  const [modelId, setModelId] = useState('');
  const [dataRefs, setDataRefs] = useState('');
  const [taskRequirements, setTaskRequirements] = useState('');
  const [maxTaskCost, setMaxTaskCost] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resources and tasks data
  const [availableCompute, setAvailableCompute] = useState([]);
  const [userTasks, setUserTasks] = useState([]);
  const [availableNodes, setAvailableNodes] = useState([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [isLoadingNodes, setIsLoadingNodes] = useState(false);

  // Task detail modal
  const [taskDetailVisible, setTaskDetailVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Error handling
  const [error, setError] = useState(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [taskCreated, setTaskCreated] = useState(false);

  // Load data when account changes or tab is switched
  useEffect(() => {
    if (isConnected && account) {
      if (activeTab === 'resources') {
        fetchAvailableCompute();
      } else if (activeTab === 'tasks') {
        fetchUserTasks();
      } else if (activeTab === 'nodes') {
        fetchAvailableNodes();
      }
    }
  }, [account, isConnected, activeTab]);

  // Reset state when network changes
  useEffect(() => {
    if (!isNetworkValid) {
      setAvailableCompute([]);
      setUserTasks([]);
      setAvailableNodes([]);
    }
  }, [isNetworkValid]);

  // Update cost estimate when compute parameters change
  useEffect(() => {
    if (isConnected && computeType && computeAmount && computeDuration) {
      estimateComputeCost();
    }
  }, [computeType, computeAmount, computeDuration]);

  // Fetch user's available compute resources
  const fetchAvailableCompute = async () => {
    try {
      setIsLoadingResources(true);
      setError(null);

      const resources = await getAvailableCompute(account);
      setAvailableCompute(resources || []);
    } catch (err) {
      console.error('Error fetching compute resources:', err);
      setError('Failed to load compute resources. Please try again.');
      message.error('Failed to load compute resources');
    } finally {
      setIsLoadingResources(false);
    }
  };

  // Fetch user's compute tasks
  const fetchUserTasks = async () => {
    try {
      setIsLoadingTasks(true);
      setError(null);

      const tasks = await getUserTasks(account);
      setUserTasks(tasks || []);
    } catch (err) {
      console.error('Error fetching user tasks:', err);
      setError('Failed to load compute tasks. Please try again.');
      message.error('Failed to load compute tasks');
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Fetch available compute nodes
  const fetchAvailableNodes = async () => {
    try {
      setIsLoadingNodes(true);
      setError(null);

      const nodes = await getAvailableNodes();
      setAvailableNodes(nodes || []);
    } catch (err) {
      console.error('Error fetching available nodes:', err);
      setError('Failed to load compute nodes. Please try again.');
      message.error('Failed to load compute nodes');
    } finally {
      setIsLoadingNodes(false);
    }
  };

  // Estimate compute resource cost
  const estimateComputeCost = async () => {
    try {
      setIsEstimating(true);
      setError(null);

      const cost = await getComputeCost(computeType, computeAmount, computeDuration);
      setEstimatedCost(cost);
    } catch (err) {
      console.error('Error estimating compute cost:', err);
      setError('Failed to estimate cost. Please try again.');
      setEstimatedCost(0);
    } finally {
      setIsEstimating(false);
    }
  };

  // Purchase compute resources
  const handlePurchaseCompute = async () => {
    if (!isConnected) {
      message.warning('Please connect your wallet first!');
      return;
    }

    if (!isNetworkValid) {
      message.warning('Please switch to a supported network!');
      return;
    }

    try {
      setIsPurchasing(true);
      setError(null);

      await purchaseCompute(computeType, computeAmount, computeDuration);

      message.success('Compute resources purchased successfully');

      // Reset form
      setComputeAmount(1);
      setComputeDuration(30);

      // Refresh resources
      fetchAvailableCompute();
    } catch (err) {
      console.error('Error purchasing compute:', err);
      setError('Failed to purchase compute: ' + (err.message || 'Unknown error'));
      message.error('Failed to purchase compute. Please try again.');
    } finally {
      setIsPurchasing(false);
    }
  };

  // Register compute node
  const handleRegisterNode = async () => {
    if (!isConnected) {
      message.warning('Please connect your wallet first!');
      return;
    }

    if (!isNetworkValid) {
      message.warning('Please switch to a supported network!');
      return;
    }

    if (!nodeType || !nodeSpecs || !nodeApiUrl) {
      message.warning('Please fill all node details!');
      return;
    }

    try {
      setIsRegistering(true);
      setError(null);

      const nodeId = await registerComputeNode(
        nodeType,
        nodePerformance,
        nodeSpecs,
        nodeApiUrl
      );

      message.success(`Node registered successfully with ID: ${nodeId}`);

      // Reset form
      setNodeType('cpu');
      setNodePerformance(1);
      setNodeSpecs('');
      setNodeApiUrl('');

      // Refresh nodes
      fetchAvailableNodes();
    } catch (err) {
      console.error('Error registering node:', err);
      setError('Failed to register node: ' + (err.message || 'Unknown error'));
      message.error('Failed to register node. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  // Submit compute task
  const handleSubmitTask = async () => {
    if (!isConnected) {
      message.warning('Please connect your wallet first!');
      return;
    }

    if (!isNetworkValid) {
      message.warning('Please switch to a supported network!');
      return;
    }

    if (!modelId || !taskRequirements) {
      message.warning('Please fill all required task details!');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Parse data references
      const dataReferences = dataRefs.split(',').map(ref => ref.trim()).filter(ref => ref);

      const taskId = await submitComputeTask(
        modelId,
        dataReferences,
        taskRequirements,
        maxTaskCost
      );

      message.success(`Task submitted successfully with ID: ${taskId}`);

      // Reset form
      setModelId('');
      setDataRefs('');
      setTaskRequirements('');
      setMaxTaskCost(0);

      // Refresh tasks
      fetchUserTasks();
    } catch (err) {
      console.error('Error submitting task:', err);
      setError('Failed to submit task: ' + (err.message || 'Unknown error'));
      message.error('Failed to submit task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // View task details
  const handleViewTask = (task) => {
    setSelectedTask(task);
    setTaskDetailVisible(true);
  };

  // Synchronize tab from URL parameters to state
  useEffect(() => {
    if (tab && ['tasks', 'create', 'resources', 'nodes'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  // Update URL when tab changes
  const handleTabChange = (key) => {
    setActiveTab(key);
    router.push({
      pathname: router.pathname,
      query: { ...router.query, tab: key },
    }, undefined, { shallow: true });
  };

  // Trigger refresh after creating a new task
  const handleTaskCreated = () => {
    setTaskCreated(true);
    setRefreshTrigger(prev => prev + 1);

    // Show success message, then switch to the task list tab
    setTimeout(() => {
      setActiveTab('tasks');
      router.push({
        pathname: router.pathname,
        query: { ...router.query, tab: 'tasks' },
      }, undefined, { shallow: true });

      // Reset notification state
      setTimeout(() => {
        setTaskCreated(false);
      }, 3000);
    }, 1500);
  };

  // Check wallet connection status
  const isWalletConnected = !!account && !!signer;

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>Distributed Computing Network | SynergyAI</title>
        <meta name="description" content="Access and contribute to our decentralized computing network." />
      </Head>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-8">
        <Card className="compute-container">
          <Title level={2}>Decentralized Compute Network</Title>
          <Text type="secondary">
            Create and manage compute tasks on SynergyAI's decentralized compute network.
          </Text>

          {!isConnected && (
            <Alert
              message="Wallet not connected"
              description="Please connect your wallet to create and manage compute tasks."
              type="warning"
              showIcon
              style={{ marginTop: 16, marginBottom: 16 }}
            />
          )}

          {isConnected && !isNetworkValid && (
            <Alert
              message="Unsupported Network"
              description="Please switch to a supported network to use compute features."
              type="error"
              showIcon
              style={{ marginTop: 16, marginBottom: 16 }}
            />
          )}

          {taskCreated && (
            <Alert
              message="Task Created Successfully!"
              description="Your compute task has been submitted to the network."
              type="success"
              showIcon
              style={{ marginTop: 16, marginBottom: 16 }}
            />
          )}

          <Divider />

          <Tabs
            activeKey={activeTab}
            onChange={handleTabChange}
          >
            <TabPane
              tab={
                <span>
                  <UnorderedListOutlined /> My Tasks
                </span>
              }
              key="tasks"
            >
              {isConnected ? (
                <TaskList
                  signer={signer}
                  provider={provider}
                  account={account}
                  networkId={networkId}
                  refreshTrigger={refreshTrigger}
                />
              ) : (
                <Skeleton active paragraph={{ rows: 6 }} />
              )}
            </TabPane>

            <TabPane
              tab={
                <span>
                  <PlusOutlined /> Create Task
                </span>
              }
              key="create"
              disabled={!isConnected || !isNetworkValid}
            >
              <ComputeTask
                signer={signer}
                provider={provider}
                account={account}
                networkId={networkId}
                onTaskCreated={handleTaskCreated}
              />
            </TabPane>

            <TabPane
              tab={
                <span>
                  <CloudServerOutlined /> My Resources
                </span>
              }
              key="resources"
            >
              <Card title="Available Compute Resources">
                {isLoadingResources ? (
                  <Spin tip="Loading resources..." />
                ) : error ? (
                  <Alert message={error} type="error" showIcon />
                ) : (
                  <>
                    {availableCompute.length > 0 ? (
                      <Table
                        dataSource={availableCompute}
                        columns={[
                          { title: 'Type', dataIndex: 'type', key: 'type' },
                          { title: 'Amount', dataIndex: 'amount', key: 'amount' },
                          {
                            title: 'Expires',
                            dataIndex: 'expiresAt',
                            key: 'expiresAt',
                            render: (date) => new Date(date * 1000).toLocaleString()
                          },
                          {
                            title: 'Status',
                            key: 'status',
                            render: (text, record) => (
                              <Tag color={record.active ? 'green' : 'red'}>
                                {record.active ? 'Active' : 'Expired'}
                              </Tag>
                            )
                          }
                        ]}
                        rowKey="id"
                      />
                    ) : (
                      <Empty description="No compute resources available" />
                    )}

                    <Divider />

                    <Title level={4}>Purchase Compute Resources</Title>
                    <Form layout="vertical">
                      <Form.Item label="Resource Type">
                        <Select
                          value={computeType}
                          onChange={setComputeType}
                          disabled={isPurchasing}
                        >
                          <Option value="cpu">CPU</Option>
                          <Option value="gpu">GPU</Option>
                          <Option value="storage">Storage</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item label="Amount">
                        <InputNumber
                          min={1}
                          value={computeAmount}
                          onChange={setComputeAmount}
                          disabled={isPurchasing}
                        />
                      </Form.Item>

                      <Form.Item label="Duration (days)">
                        <InputNumber
                          min={1}
                          value={computeDuration}
                          onChange={setComputeDuration}
                          disabled={isPurchasing}
                        />
                      </Form.Item>

                      <Form.Item label="Estimated Cost">
                        <Input
                          value={`${estimatedCost} AIP`}
                          disabled
                          suffix={isEstimating && <Spin size="small" />}
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          onClick={handlePurchaseCompute}
                          loading={isPurchasing}
                          disabled={!isConnected || !isNetworkValid || isEstimating}
                        >
                          Purchase
                        </Button>
                      </Form.Item>
                    </Form>
                  </>
                )}
              </Card>
            </TabPane>

            <TabPane
              tab={
                <span>
                  <NodeIndexOutlined /> Compute Nodes
                </span>
              }
              key="nodes"
            >
              <Card title="Available Compute Nodes">
                {isLoadingNodes ? (
                  <Spin tip="Loading nodes..." />
                ) : error ? (
                  <Alert message={error} type="error" showIcon />
                ) : (
                  <>
                    {availableNodes.length > 0 ? (
                      <Table
                        dataSource={availableNodes}
                        columns={[
                          { title: 'Node ID', dataIndex: 'id', key: 'id' },
                          { title: 'Type', dataIndex: 'type', key: 'type' },
                          { title: 'Performance', dataIndex: 'performance', key: 'performance' },
                          { title: 'Owner', dataIndex: 'owner', key: 'owner', ellipsis: true },
                          {
                            title: 'Status',
                            key: 'status',
                            render: (text, record) => (
                              <Tag color={record.active ? 'green' : 'red'}>
                                {record.active ? 'Active' : 'Inactive'}
                              </Tag>
                            )
                          }
                        ]}
                        rowKey="id"
                        expandable={{
                          expandedRowRender: record => (
                            <div>
                              <p><strong>Specifications:</strong> {record.specs}</p>
                              <p><strong>API URL:</strong> {record.apiUrl}</p>
                              <p><strong>Registered:</strong> {new Date(record.registeredAt * 1000).toLocaleString()}</p>
                            </div>
                          )
                        }}
                      />
                    ) : (
                      <Empty description="No compute nodes available" />
                    )}

                    <Divider />

                    <Title level={4}>Register Compute Node</Title>
                    <Form layout="vertical">
                      <Form.Item label="Node Type">
                        <Select
                          value={nodeType}
                          onChange={setNodeType}
                          disabled={isRegistering}
                        >
                          <Option value="cpu">CPU</Option>
                          <Option value="gpu">GPU</Option>
                          <Option value="hybrid">Hybrid</Option>
                        </Select>
                      </Form.Item>

                      <Form.Item label="Performance Level">
                        <InputNumber
                          min={1}
                          max={10}
                          value={nodePerformance}
                          onChange={setNodePerformance}
                          disabled={isRegistering}
                        />
                      </Form.Item>

                      <Form.Item label="Specifications">
                        <TextArea
                          rows={4}
                          value={nodeSpecs}
                          onChange={(e) => setNodeSpecs(e.target.value)}
                          disabled={isRegistering}
                          placeholder="Enter detailed specifications (CPU/GPU model, memory, storage, etc.)"
                        />
                      </Form.Item>

                      <Form.Item label="API URL">
                        <Input
                          value={nodeApiUrl}
                          onChange={(e) => setNodeApiUrl(e.target.value)}
                          disabled={isRegistering}
                          placeholder="Enter URL for your compute node API"
                        />
                      </Form.Item>

                      <Form.Item>
                        <Button
                          type="primary"
                          onClick={handleRegisterNode}
                          loading={isRegistering}
                          disabled={!isConnected || !isNetworkValid}
                        >
                          Register Node
                        </Button>
                      </Form.Item>
                    </Form>
                  </>
                )}
              </Card>
            </TabPane>
          </Tabs>
        </Card>
      </main>

      <Footer />

      {/* Task detail modal */}
      <Modal
        title="Task Details"
        visible={taskDetailVisible}
        onCancel={() => setTaskDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTaskDetailVisible(false)}>
            Close
          </Button>
        ]}
        width={700}
      >
        {selectedTask && (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Task ID">{selectedTask.id}</Descriptions.Item>
            <Descriptions.Item label="Model ID">{selectedTask.modelId}</Descriptions.Item>
            <Descriptions.Item label="Status">
              <Tag color={selectedTask.status === 'completed' ? 'green' :
                         selectedTask.status === 'running' ? 'blue' :
                         selectedTask.status === 'failed' ? 'red' : 'orange'}>
                {selectedTask.status.toUpperCase()}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Created At">
              {new Date(selectedTask.createdAt * 1000).toLocaleString()}
            </Descriptions.Item>
            <Descriptions.Item label="Data References">
              {selectedTask.dataRefs}
            </Descriptions.Item>
            <Descriptions.Item label="Requirements">
              <pre>{selectedTask.requirements}</pre>
            </Descriptions.Item>
            <Descriptions.Item label="Max Cost">{selectedTask.maxCost} AIP</Descriptions.Item>

            {selectedTask.assignedNode && (
              <Descriptions.Item label="Assigned Node">
                {selectedTask.assignedNode}
              </Descriptions.Item>
            )}

            {selectedTask.progress !== undefined && (
              <Descriptions.Item label="Progress">
                <Progress percent={selectedTask.progress} status={
                  selectedTask.status === 'completed' ? 'success' :
                  selectedTask.status === 'failed' ? 'exception' : 'active'
                } />
              </Descriptions.Item>
            )}

            {selectedTask.result && (
              <Descriptions.Item label="Result">
                <Collapse defaultActiveKey={['1']}>
                  <Panel header="View Result" key="1">
                    <pre>{selectedTask.result}</pre>
                  </Panel>
                </Collapse>
              </Descriptions.Item>
            )}
          </Descriptions>
        )}
      </Modal>
    </div>
  );
};

export default ComputePage;
