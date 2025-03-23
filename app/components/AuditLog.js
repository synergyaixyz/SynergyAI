/**
 * AuditLog Component
 * Displays access and modification history for datasets
 * to provide transparency and accountability
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  Timeline,
  Typography,
  Space,
  Tag,
  Button,
  Tooltip,
  Spin,
  Empty,
  Dropdown,
  Menu,
  DatePicker,
  Badge,
  Divider
} from 'antd';
import {
  HistoryOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  KeyOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  DownloadOutlined,
  UploadOutlined,
  SyncOutlined,
  FilterOutlined,
  ClockCircleOutlined,
  LockOutlined,
  UnlockOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import { useWallet } from '../hooks/useWallet';
import { truncateString, formatDate } from '../utils/formatting';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

// Mock event types for demonstration
const EVENT_TYPES = {
  ACCESS: 'access',
  MODIFICATION: 'modification',
  PERMISSION_CHANGE: 'permission_change',
  OWNERSHIP_TRANSFER: 'ownership_transfer',
  UPLOAD: 'upload',
  DOWNLOAD: 'download',
  DELETE: 'delete',
  ENCRYPT: 'encrypt',
  DECRYPT: 'decrypt',
};

// Event actions for each type
const EVENT_ACTIONS = {
  [EVENT_TYPES.ACCESS]: 'accessed',
  [EVENT_TYPES.MODIFICATION]: 'modified',
  [EVENT_TYPES.PERMISSION_CHANGE]: 'changed permissions for',
  [EVENT_TYPES.OWNERSHIP_TRANSFER]: 'transferred ownership of',
  [EVENT_TYPES.UPLOAD]: 'uploaded',
  [EVENT_TYPES.DOWNLOAD]: 'downloaded',
  [EVENT_TYPES.DELETE]: 'deleted',
  [EVENT_TYPES.ENCRYPT]: 'encrypted',
  [EVENT_TYPES.DECRYPT]: 'decrypted',
};

// Timeline item colors by event type
const EVENT_COLORS = {
  [EVENT_TYPES.ACCESS]: 'blue',
  [EVENT_TYPES.MODIFICATION]: 'green',
  [EVENT_TYPES.PERMISSION_CHANGE]: 'purple',
  [EVENT_TYPES.OWNERSHIP_TRANSFER]: 'gold',
  [EVENT_TYPES.UPLOAD]: 'cyan',
  [EVENT_TYPES.DOWNLOAD]: 'geekblue',
  [EVENT_TYPES.DELETE]: 'red',
  [EVENT_TYPES.ENCRYPT]: 'magenta',
  [EVENT_TYPES.DECRYPT]: 'lime',
};

// Icons for different event types
const EVENT_ICONS = {
  [EVENT_TYPES.ACCESS]: <EyeOutlined />,
  [EVENT_TYPES.MODIFICATION]: <EditOutlined />,
  [EVENT_TYPES.PERMISSION_CHANGE]: <KeyOutlined />,
  [EVENT_TYPES.OWNERSHIP_TRANSFER]: <SyncOutlined />,
  [EVENT_TYPES.UPLOAD]: <UploadOutlined />,
  [EVENT_TYPES.DOWNLOAD]: <DownloadOutlined />,
  [EVENT_TYPES.DELETE]: <DeleteOutlined />,
  [EVENT_TYPES.ENCRYPT]: <LockOutlined />,
  [EVENT_TYPES.DECRYPT]: <UnlockOutlined />,
};

// Simulated function to get audit events - in a real app, this would call a blockchain or API endpoint
const fetchAuditEvents = async (datasetId, options = {}) => {
  // In a real implementation, this would fetch data from the blockchain or a backend API
  // Simulating network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate mock data
  const mockEvents = [
    {
      id: '1',
      type: EVENT_TYPES.UPLOAD,
      timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      user: '0x1234567890123456789012345678901234567890',
      details: {
        datasetName: 'Financial Dataset',
        fileCount: 5,
      }
    },
    {
      id: '2',
      type: EVENT_TYPES.ACCESS,
      timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
      user: '0x2345678901234567890123456789012345678901',
      details: {
        reason: 'Data analysis',
        ipAddress: '192.168.1.1'
      }
    },
    {
      id: '3',
      type: EVENT_TYPES.PERMISSION_CHANGE,
      timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      user: '0x1234567890123456789012345678901234567890',
      details: {
        targetUser: '0x3456789012345678901234567890123456789012',
        oldPermission: 'read',
        newPermission: 'modify'
      }
    },
    {
      id: '4',
      type: EVENT_TYPES.MODIFICATION,
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      user: '0x3456789012345678901234567890123456789012',
      details: {
        changedFiles: ['data_analysis.csv', 'results.json'],
        description: 'Updated analysis results',
      }
    },
    {
      id: '5',
      type: EVENT_TYPES.DOWNLOAD,
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      user: '0x2345678901234567890123456789012345678901',
      details: {
        fileCount: 2,
        totalSize: '25MB'
      }
    },
    {
      id: '6',
      type: EVENT_TYPES.ACCESS,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      user: '0x4567890123456789012345678901234567890123',
      details: {
        reason: 'Verification',
        ipAddress: '10.0.0.5'
      }
    },
    {
      id: '7',
      type: EVENT_TYPES.PERMISSION_CHANGE,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      user: '0x1234567890123456789012345678901234567890',
      details: {
        targetUser: '0x4567890123456789012345678901234567890123',
        oldPermission: 'read',
        newPermission: 'none'
      }
    },
    {
      id: '8',
      type: EVENT_TYPES.MODIFICATION,
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      user: '0x3456789012345678901234567890123456789012',
      details: {
        changedFiles: ['final_results.json'],
        description: 'Finalized results',
      }
    },
    {
      id: '9',
      type: EVENT_TYPES.ACCESS,
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      user: '0x1234567890123456789012345678901234567890',
      details: {
        reason: 'Final review',
        ipAddress: '192.168.2.10'
      }
    },
    {
      id: '10',
      type: EVENT_TYPES.OWNERSHIP_TRANSFER,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      user: '0x1234567890123456789012345678901234567890',
      details: {
        newOwner: '0x5678901234567890123456789012345678901234',
        reason: 'Project transfer'
      }
    }
  ];

  // Filter events based on options
  let filteredEvents = [...mockEvents];

  // Filter by event type
  if (options.eventTypes && options.eventTypes.length > 0) {
    filteredEvents = filteredEvents.filter(event => options.eventTypes.includes(event.type));
  }

  // Filter by user
  if (options.users && options.users.length > 0) {
    filteredEvents = filteredEvents.filter(event => options.users.includes(event.user));
  }

  // Filter by date range
  if (options.dateRange) {
    const [startDate, endDate] = options.dateRange;
    if (startDate && endDate) {
      filteredEvents = filteredEvents.filter(event =>
        event.timestamp >= startDate && event.timestamp <= endDate
      );
    }
  }

  // Sort by timestamp (newest first)
  filteredEvents.sort((a, b) => b.timestamp - a.timestamp);

  return filteredEvents;
};

const AuditLog = ({ datasetId, datasetName }) => {
  const { account } = useWallet();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const [dateRange, setDateRange] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);

    try {
      const options = {
        eventTypes: selectedEventTypes.length > 0 ? selectedEventTypes : null,
        dateRange: dateRange,
      };

      const auditEvents = await fetchAuditEvents(datasetId, options);
      setEvents(auditEvents);
    } catch (error) {
      console.error('Error fetching audit events:', error);
      setError('Failed to load audit log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch events on initial load and when filters change
  useEffect(() => {
    if (datasetId) {
      fetchEvents();
    }
  }, [datasetId, selectedEventTypes, dateRange]);

  const handleEventTypeChange = (checkedValues) => {
    setSelectedEventTypes(checkedValues);
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
  };

  const renderEventDetails = (event) => {
    switch (event.type) {
      case EVENT_TYPES.UPLOAD:
        return (
          <Space direction="vertical">
            <Text>Dataset: {event.details.datasetName}</Text>
            <Text>Files: {event.details.fileCount}</Text>
          </Space>
        );

      case EVENT_TYPES.ACCESS:
        return (
          <Space direction="vertical">
            <Text>Reason: {event.details.reason}</Text>
            <Text>IP: {event.details.ipAddress}</Text>
          </Space>
        );

      case EVENT_TYPES.PERMISSION_CHANGE:
        return (
          <Space direction="vertical">
            <Space>
              <Text>User:</Text>
              <Text code>{truncateString(event.details.targetUser, 6, 4)}</Text>
            </Space>
            <Space>
              <Text>Permission:</Text>
              <Tag color="red">{event.details.oldPermission}</Tag>
              <ArrowRightOutlined />
              <Tag color="green">{event.details.newPermission}</Tag>
            </Space>
          </Space>
        );

      case EVENT_TYPES.MODIFICATION:
        return (
          <Space direction="vertical">
            <Text>Modified files: {event.details.changedFiles.join(', ')}</Text>
            <Text>Description: {event.details.description}</Text>
          </Space>
        );

      case EVENT_TYPES.DOWNLOAD:
        return (
          <Space direction="vertical">
            <Text>Files: {event.details.fileCount}</Text>
            <Text>Size: {event.details.totalSize}</Text>
          </Space>
        );

      case EVENT_TYPES.OWNERSHIP_TRANSFER:
        return (
          <Space direction="vertical">
            <Space>
              <Text>New Owner:</Text>
              <Text code>{truncateString(event.details.newOwner, 6, 4)}</Text>
            </Space>
            <Text>Reason: {event.details.reason}</Text>
          </Space>
        );

      default:
        return null;
    }
  };

  // Generate the event filter menu
  const eventTypeMenu = (
    <Menu
      selectable
      multiple
      selectedKeys={selectedEventTypes}
      onSelect={(e) => setSelectedEventTypes([...selectedEventTypes, e.key])}
      onDeselect={(e) => setSelectedEventTypes(selectedEventTypes.filter(type => type !== e.key))}
    >
      <Menu.ItemGroup title="Filter by Event Type">
        <Menu.Item key={EVENT_TYPES.ACCESS} icon={EVENT_ICONS[EVENT_TYPES.ACCESS]}>
          Access
        </Menu.Item>
        <Menu.Item key={EVENT_TYPES.MODIFICATION} icon={EVENT_ICONS[EVENT_TYPES.MODIFICATION]}>
          Modification
        </Menu.Item>
        <Menu.Item key={EVENT_TYPES.PERMISSION_CHANGE} icon={EVENT_ICONS[EVENT_TYPES.PERMISSION_CHANGE]}>
          Permission Change
        </Menu.Item>
        <Menu.Item key={EVENT_TYPES.OWNERSHIP_TRANSFER} icon={EVENT_ICONS[EVENT_TYPES.OWNERSHIP_TRANSFER]}>
          Ownership Transfer
        </Menu.Item>
        <Menu.Item key={EVENT_TYPES.UPLOAD} icon={EVENT_ICONS[EVENT_TYPES.UPLOAD]}>
          Upload
        </Menu.Item>
        <Menu.Item key={EVENT_TYPES.DOWNLOAD} icon={EVENT_ICONS[EVENT_TYPES.DOWNLOAD]}>
          Download
        </Menu.Item>
        <Menu.Item key={EVENT_TYPES.DELETE} icon={EVENT_ICONS[EVENT_TYPES.DELETE]}>
          Delete
        </Menu.Item>
      </Menu.ItemGroup>
      <Menu.Divider />
      <Menu.Item key="clear" onClick={() => setSelectedEventTypes([])}>
        Clear Filters
      </Menu.Item>
    </Menu>
  );

  return (
    <Card
      title={
        <Space>
          <HistoryOutlined />
          <span>Audit Log</span>
          {datasetName && <Tag color="blue">{datasetName}</Tag>}
        </Space>
      }
      extra={
        <Space>
          <RangePicker onChange={handleDateRangeChange} />
          <Dropdown overlay={eventTypeMenu} trigger={['click']}>
            <Button icon={<FilterOutlined />}>
              Filter {selectedEventTypes.length > 0 && <Badge count={selectedEventTypes.length} />}
            </Button>
          </Dropdown>
        </Space>
      }
      className="audit-log-card"
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin />
          <p>Loading audit events...</p>
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="danger">{error}</Text>
          <Button
            onClick={fetchEvents}
            style={{ marginTop: '10px' }}
          >
            Retry
          </Button>
        </div>
      ) : events.length === 0 ? (
        <Empty description="No audit events found for the selected filters" />
      ) : (
        <Timeline>
          {events.map(event => (
            <Timeline.Item
              key={event.id}
              color={EVENT_COLORS[event.type]}
              dot={EVENT_ICONS[event.type]}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space align="center">
                  <Tag color={EVENT_COLORS[event.type]}>
                    {event.type.replace('_', ' ').toUpperCase()}
                  </Tag>
                  <Tooltip title={event.user}>
                    <Text strong>{truncateString(event.user, 6, 4)}</Text>
                  </Tooltip>
                  <Text type="secondary">{EVENT_ACTIONS[event.type]}</Text>
                  <Text>{datasetName || 'the dataset'}</Text>
                </Space>

                <div className="audit-event-details">
                  {renderEventDetails(event)}
                </div>

                <Text type="secondary">
                  <ClockCircleOutlined /> {formatDate(event.timestamp, { includeTime: true })}
                </Text>
              </Space>
            </Timeline.Item>
          ))}
        </Timeline>
      )}
    </Card>
  );
};

export default AuditLog;
