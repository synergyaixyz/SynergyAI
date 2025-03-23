/**
 * TaskList Component
 *
 * Displays and manages the user's compute tasks,
 * showing task status, details, and allows downloading results.
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Typography,
  Modal,
  Descriptions,
  Tooltip,
  Badge,
  Spin,
  Empty,
  message,
  Progress,
  Tabs,
  Drawer,
  Collapse,
  Alert,
  List,
  Timeline,
  Divider,
  Statistic,
  Row,
  Col,
  Input
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileTextOutlined,
  DownloadOutlined,
  EyeOutlined,
  DeleteOutlined,
  SyncOutlined,
  InfoCircleOutlined,
  CodeOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { ethers } from 'ethers';
import { formatDistance } from 'date-fns';
import { ComputeManager } from '../blockchain/contracts/ComputeManager';
import JsonView from 'react-json-view';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { TextArea } = Input;

// Task status enum
const TASK_STATUS = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  RUNNING: 'running',
  COMPLETED: 'completed',
  VERIFIED: 'verified',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
};

// Status colors
const STATUS_COLORS = {
  [TASK_STATUS.PENDING]: 'orange',
  [TASK_STATUS.ASSIGNED]: 'blue',
  [TASK_STATUS.RUNNING]: 'geekblue',
  [TASK_STATUS.COMPLETED]: 'cyan',
  [TASK_STATUS.VERIFIED]: 'green',
  [TASK_STATUS.FAILED]: 'red',
  [TASK_STATUS.CANCELLED]: 'gray'
};

// Status icons
const STATUS_ICONS = {
  [TASK_STATUS.PENDING]: <ClockCircleOutlined />,
  [TASK_STATUS.ASSIGNED]: <SyncOutlined spin />,
  [TASK_STATUS.RUNNING]: <PlayCircleOutlined spin />,
  [TASK_STATUS.COMPLETED]: <CheckCircleOutlined />,
  [TASK_STATUS.VERIFIED]: <CheckCircleOutlined />,
  [TASK_STATUS.FAILED]: <CloseCircleOutlined />,
  [TASK_STATUS.CANCELLED]: <PauseCircleOutlined />
};

const TaskList = ({
  signer,
  provider,
  account,
  networkId,
  refreshTrigger = 0
}) => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [taskResults, setTaskResults] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [resultsVisible, setResultsVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState('active');
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [acceptResults, setAcceptResults] = useState(true);
  const [verifyFeedback, setVerifyFeedback] = useState('');

  // Get user task list
  const fetchTasks = async () => {
    if (!provider || !account || !networkId) return;

    try {
      setLoading(true);

      const computeManager = new ComputeManager(provider);
      const taskIds = await computeManager.getTasksByOwner(account, networkId);

      if (taskIds.length === 0) {
        setTasks([]);
        return;
      }

      // Get detailed information for each task
      const taskDetails = await Promise.all(
        taskIds.map(id => computeManager.getTaskInfo(id, networkId))
      );

      // Process task information
      const formattedTasks = taskDetails.map(task => {
        const status = getTaskStatus(task);
        const createdDate = new Date(task.createdAt * 1000);

        return {
          id: task.id,
          dataId: task.dataId,
          type: task.taskType,
          status,
          createdAt: createdDate,
          timeAgo: formatDistance(createdDate, new Date(), { addSuffix: true }),
          estimatedCompletion: task.estimatedCompletion ? new Date(task.estimatedCompletion * 1000) : null,
          completedAt: task.completedAt ? new Date(task.completedAt * 1000) : null,
          assignedNode: task.assignedNode,
          requirements: task.requirements ? JSON.parse(task.requirements) : {},
          maxPrice: ethers.utils.formatEther(task.maxPrice),
          resultLocation: task.resultLocation,
          resultMetadata: task.resultMetadata ? JSON.parse(task.resultMetadata) : null,
          verified: task.verified,
          accepted: task.accepted,
          feedback: task.feedback,
          cancelled: task.cancelled,
          raw: task
        };
      });

      setTasks(formattedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  // Get task status
  const getTaskStatus = (task) => {
    if (task.cancelled) return TASK_STATUS.CANCELLED;
    if (task.verified) return TASK_STATUS.VERIFIED;
    if (task.completed) return TASK_STATUS.COMPLETED;
    if (task.assignedNode && task.assignedAt > 0) {
      return Date.now() / 1000 < task.estimatedCompletion
        ? TASK_STATUS.RUNNING
        : TASK_STATUS.ASSIGNED;
    }
    return TASK_STATUS.PENDING;
  };

  // Calculate task progress
  const calculateProgress = (task) => {
    if (task.status === TASK_STATUS.COMPLETED || task.status === TASK_STATUS.VERIFIED) {
      return 100;
    }

    if (task.status === TASK_STATUS.PENDING) {
      return 0;
    }

    if (task.status === TASK_STATUS.RUNNING || task.status === TASK_STATUS.ASSIGNED) {
      if (!task.estimatedCompletion) return 50;

      const startTime = task.raw.assignedAt;
      const endTime = task.raw.estimatedCompletion;
      const currentTime = Math.floor(Date.now() / 1000);

      if (currentTime >= endTime) return 99;

      const totalDuration = endTime - startTime;
      const elapsed = currentTime - startTime;

      return Math.min(99, Math.floor((elapsed / totalDuration) * 100));
    }

    return 0;
  };

  // Get task results
  const fetchTaskResults = async (taskId) => {
    if (!provider || !networkId) return;

    try {
      setResultsLoading(true);

      const computeManager = new ComputeManager(provider);
      const results = await computeManager.getTaskResults(taskId, networkId);

      setTaskResults(results);

    } catch (error) {
      console.error('Error fetching task results:', error);
      message.error('Failed to load task results');
      setTaskResults(null);
    } finally {
      setResultsLoading(false);
    }
  };

  // Cancel task
  const cancelTask = async (taskId) => {
    if (!signer || !networkId) {
      message.error('Wallet not connected');
      return;
    }

    try {
      Modal.confirm({
        title: 'Confirm Cancellation',
        content: 'Are you sure you want to cancel this task? This action cannot be undone.',
        okText: 'Yes, Cancel Task',
        okType: 'danger',
        cancelText: 'No',
        onOk: async () => {
          const computeManager = new ComputeManager(signer);
          const tx = await computeManager.cancelTask(taskId, networkId);

          message.success('Task cancelled successfully');
          fetchTasks(); // Refresh task list
        }
      });
    } catch (error) {
      console.error('Error cancelling task:', error);
      message.error('Failed to cancel task');
    }
  };

  // Verify task results
  const verifyTaskResults = async () => {
    if (!signer || !networkId || !selectedTask) {
      message.error('Wallet not connected or no task selected');
      return;
    }

    try {
      setVerifyLoading(true);

      const computeManager = new ComputeManager(signer);
      await computeManager.verifyTaskResults(
        selectedTask.id,
        acceptResults,
        verifyFeedback,
        networkId
      );

      message.success(`Task results ${acceptResults ? 'accepted' : 'rejected'} successfully`);
      setVerifyModalVisible(false);
      fetchTasks(); // Refresh task list

    } catch (error) {
      console.error('Error verifying task results:', error);
      message.error('Failed to verify task results');
    } finally {
      setVerifyLoading(false);
    }
  };

  // Show task details
  const showTaskDetails = (task) => {
    setSelectedTask(task);
    setDetailsVisible(true);
  };

  // Show task results
  const showTaskResults = (task) => {
    setSelectedTask(task);
    fetchTaskResults(task.id);
    setResultsVisible(true);
  };

  // Show verify modal
  const showVerifyModal = (task) => {
    setSelectedTask(task);
    setAcceptResults(true);
    setVerifyFeedback('');
    setVerifyModalVisible(true);
  };

  // Download task results
  const downloadResults = (task) => {
    if (!task.resultLocation) {
      message.error('No results available for download');
      return;
    }

    // In a real application, this would be logic to retrieve results from IPFS or other storage services
    // This is just a simulation
    message.info('Downloading results from ' + task.resultLocation);

    // Simulate download
    setTimeout(() => {
      message.success('Results downloaded successfully');
    }, 2000);
  };

  // Table column definition
  const columns = [
    {
      title: 'Task ID',
      dataIndex: 'id',
      key: 'id',
      render: (id) => <Text ellipsis>{id}</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag>
          {type === 'ANALYSIS' && <BarChartOutlined />}
          {type === 'PROCESSING' && <CodeOutlined />}
          {type === 'TRAINING' && <SettingOutlined />}
          {' ' + type}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag icon={STATUS_ICONS[status]} color={STATUS_COLORS[status]}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Progress',
      key: 'progress',
      render: (_, record) => {
        const progress = calculateProgress(record);
        return (
          <Progress
            percent={progress}
            size="small"
            status={
              record.status === TASK_STATUS.COMPLETED || record.status === TASK_STATUS.VERIFIED
                ? 'success'
                : record.status === TASK_STATUS.FAILED
                  ? 'exception'
                  : 'active'
            }
          />
        );
      },
    },
    {
      title: 'Created',
      dataIndex: 'timeAgo',
      key: 'timeAgo',
    },
    {
      title: 'Max Budget',
      dataIndex: 'maxPrice',
      key: 'maxPrice',
      render: (price) => `${price} AIP`,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => showTaskDetails(record)}
            />
          </Tooltip>

          {(record.status === TASK_STATUS.COMPLETED) && (
            <Tooltip title="Verify Results">
              <Button
                type="text"
                icon={<CheckCircleOutlined />}
                onClick={() => showVerifyModal(record)}
              />
            </Tooltip>
          )}

          {(record.status === TASK_STATUS.COMPLETED || record.status === TASK_STATUS.VERIFIED) && (
            <Tooltip title="View Results">
              <Button
                type="text"
                icon={<FileTextOutlined />}
                onClick={() => showTaskResults(record)}
              />
            </Tooltip>
          )}

          {(record.status === TASK_STATUS.PENDING) && (
            <Tooltip title="Cancel Task">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={() => cancelTask(record.id)}
              />
            </Tooltip>
          )}

          {(record.status === TASK_STATUS.COMPLETED || record.status === TASK_STATUS.VERIFIED) && record.resultLocation && (
            <Tooltip title="Download Results">
              <Button
                type="text"
                icon={<DownloadOutlined />}
                onClick={() => downloadResults(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  // Initial and refresh logic
  useEffect(() => {
    fetchTasks();
  }, [account, networkId, refreshTrigger]);

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (selectedTab === 'active') {
      return [TASK_STATUS.PENDING, TASK_STATUS.ASSIGNED, TASK_STATUS.RUNNING].includes(task.status);
    } else if (selectedTab === 'completed') {
      return [TASK_STATUS.COMPLETED, TASK_STATUS.VERIFIED].includes(task.status);
    } else if (selectedTab === 'cancelled') {
      return [TASK_STATUS.FAILED, TASK_STATUS.CANCELLED].includes(task.status);
    }
    return true;
  });

  return (
    <div className="task-list-container">
      <Card
        title="My Compute Tasks"
        extra={
          <Button
            type="primary"
            icon={<SyncOutlined />}
            onClick={fetchTasks}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        <Tabs
          activeKey={selectedTab}
          onChange={setSelectedTab}
        >
          <TabPane tab="Active Tasks" key="active" />
          <TabPane tab="Completed Tasks" key="completed" />
          <TabPane tab="Cancelled/Failed Tasks" key="cancelled" />
        </Tabs>

        {tasks.length === 0 ? (
          <Empty
            description={
              loading
                ? "Loading tasks..."
                : "No tasks found. Create a new compute task to get started."
            }
          >
            {loading && <Spin />}
          </Empty>
        ) : (
          <Table
            dataSource={filteredTasks}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 5 }}
          />
        )}
      </Card>

      {/* Task details drawer */}
      <Drawer
        title="Task Details"
        width={600}
        onClose={() => setDetailsVisible(false)}
        visible={detailsVisible}
        extra={
          <Space>
            <Button onClick={() => setDetailsVisible(false)}>Close</Button>
          </Space>
        }
      >
        {selectedTask && (
          <>
            <Descriptions title="Basic Information" bordered column={1}>
              <Descriptions.Item label="Task ID">{selectedTask.id}</Descriptions.Item>
              <Descriptions.Item label="Type">{selectedTask.type}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag icon={STATUS_ICONS[selectedTask.status]} color={STATUS_COLORS[selectedTask.status]}>
                  {selectedTask.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Created At">
                {selectedTask.createdAt.toLocaleString()}
              </Descriptions.Item>
              {selectedTask.completedAt && (
                <Descriptions.Item label="Completed At">
                  {selectedTask.completedAt.toLocaleString()}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Dataset ID">{selectedTask.dataId}</Descriptions.Item>
              <Descriptions.Item label="Max Budget">{selectedTask.maxPrice} AIP</Descriptions.Item>
            </Descriptions>

            <Divider />

            <Collapse defaultActiveKey={['1']} className="task-details-collapse">
              <Panel header="Resource Requirements" key="1">
                {selectedTask.requirements ? (
                  <List
                    size="small"
                    bordered
                    dataSource={Object.entries(selectedTask.requirements)}
                    renderItem={([key, value]) => (
                      <List.Item>
                        <Text strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</Text> {
                          typeof value === 'object' ? JSON.stringify(value) : value.toString()
                        }
                      </List.Item>
                    )}
                  />
                ) : (
                  <Text>No requirements specified</Text>
                )}
              </Panel>

              {selectedTask.assignedNode && (
                <Panel header="Compute Node Information" key="2">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Node Address">
                      {selectedTask.assignedNode}
                    </Descriptions.Item>
                    {selectedTask.estimatedCompletion && (
                      <Descriptions.Item label="Estimated Completion">
                        {new Date(selectedTask.estimatedCompletion).toLocaleString()}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Panel>
              )}

              {selectedTask.resultMetadata && (
                <Panel header="Result Information" key="3">
                  <Descriptions column={1} size="small">
                    {selectedTask.resultLocation && (
                      <Descriptions.Item label="Result Location">
                        {selectedTask.resultLocation}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Result Metadata">
                      <JsonView
                        src={selectedTask.resultMetadata}
                        collapsed={2}
                        displayDataTypes={false}
                      />
                    </Descriptions.Item>
                  </Descriptions>
                </Panel>
              )}

              {selectedTask.verified && (
                <Panel header="Verification Information" key="4">
                  <Alert
                    message={selectedTask.accepted ? "Results Accepted" : "Results Rejected"}
                    description={selectedTask.feedback || "No feedback provided"}
                    type={selectedTask.accepted ? "success" : "error"}
                    showIcon
                  />
                </Panel>
              )}
            </Collapse>

            <Divider />

            <Timeline mode="left">
              <Timeline.Item>
                Task Created<br/>
                <Text type="secondary">{selectedTask.createdAt.toLocaleString()}</Text>
              </Timeline.Item>

              {selectedTask.status !== TASK_STATUS.PENDING && (
                <Timeline.Item color="blue">
                  Task Assigned<br/>
                  <Text type="secondary">
                    {selectedTask.raw.assignedAt > 0
                      ? new Date(selectedTask.raw.assignedAt * 1000).toLocaleString()
                      : 'Unknown'}
                  </Text>
                </Timeline.Item>
              )}

              {(selectedTask.status === TASK_STATUS.COMPLETED || selectedTask.status === TASK_STATUS.VERIFIED) && (
                <Timeline.Item color="green">
                  Task Completed<br/>
                  <Text type="secondary">{selectedTask.completedAt.toLocaleString()}</Text>
                </Timeline.Item>
              )}

              {selectedTask.verified && (
                <Timeline.Item
                  color={selectedTask.accepted ? "green" : "red"}
                >
                  Results {selectedTask.accepted ? "Accepted" : "Rejected"}<br/>
                  <Text type="secondary">
                    {selectedTask.feedback
                      ? `Feedback: ${selectedTask.feedback}`
                      : 'No feedback provided'}
                  </Text>
                </Timeline.Item>
              )}

              {selectedTask.status === TASK_STATUS.CANCELLED && (
                <Timeline.Item color="red">
                  Task Cancelled<br/>
                  <Text type="secondary">
                    {selectedTask.raw.cancelledAt > 0
                      ? new Date(selectedTask.raw.cancelledAt * 1000).toLocaleString()
                      : 'Unknown'}
                  </Text>
                </Timeline.Item>
              )}
            </Timeline>
          </>
        )}
      </Drawer>

      {/* Task results drawer */}
      <Drawer
        title="Task Results"
        width={600}
        onClose={() => setResultsVisible(false)}
        visible={resultsVisible}
        extra={
          selectedTask && selectedTask.resultLocation && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => downloadResults(selectedTask)}
            >
              Download
            </Button>
          )
        }
      >
        {resultsLoading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>Loading results...</div>
          </div>
        ) : (
          taskResults ? (
            <div className="task-results-container">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Card title="Result Summary">
                    <JsonView
                      src={taskResults.summary || { message: 'No summary available' }}
                      collapsed={1}
                      displayDataTypes={false}
                    />
                  </Card>
                </Col>

                {taskResults.details && (
                  <Col span={24}>
                    <Collapse defaultActiveKey={['details']}>
                      <Panel header="Result Details" key="details">
                        <JsonView
                          src={taskResults.details}
                          collapsed={2}
                          displayDataTypes={false}
                        />
                      </Panel>
                    </Collapse>
                  </Col>
                )}

                {taskResults.visualizations && taskResults.visualizations.length > 0 && (
                  <Col span={24}>
                    <Card title="Visualizations">
                      {/* Rendering will be based on the type of visualization data returned */}
                      <Text>This would display charts and visualizations in a real implementation</Text>
                    </Card>
                  </Col>
                )}
              </Row>
            </div>
          ) : (
            <Empty description="No results available" />
          )
        )}
      </Drawer>

      {/* Verify results modal */}
      <Modal
        title="Verify Task Results"
        visible={verifyModalVisible}
        onCancel={() => setVerifyModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setVerifyModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type={acceptResults ? "primary" : "danger"}
            loading={verifyLoading}
            onClick={verifyTaskResults}
          >
            {acceptResults ? 'Accept Results' : 'Reject Results'}
          </Button>,
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Task Result Verification"
            description="Please review the task results and either accept them to finalize payment or reject them with feedback."
            type="info"
            showIcon
          />

          <div style={{ marginBottom: 16, marginTop: 16 }}>
            <Text strong>Do you accept the results?</Text>
            <div style={{ marginTop: 8 }}>
              <Space>
                <Button
                  type={acceptResults ? "primary" : "default"}
                  onClick={() => setAcceptResults(true)}
                >
                  Accept
                </Button>
                <Button
                  type={!acceptResults ? "danger" : "default"}
                  onClick={() => setAcceptResults(false)}
                >
                  Reject
                </Button>
              </Space>
            </div>
          </div>

          <div>
            <Text strong>Feedback (optional):</Text>
            <TextArea
              rows={4}
              placeholder={acceptResults
                ? "Add any comments about the results..."
                : "Please explain why you are rejecting the results..."
              }
              value={verifyFeedback}
              onChange={(e) => setVerifyFeedback(e.target.value)}
              style={{ marginTop: 8 }}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
};

export default TaskList;
