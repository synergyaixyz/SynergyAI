/**
 * Transaction history component
 * Displays a list of token transactions with filtering and sorting
 */

import React, { useState, useEffect } from 'react';
import { Table, Card, Tag, Space, Select, DatePicker, Input, Button, Typography, Tooltip } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined, ArrowUpOutlined, ArrowDownOutlined, LinkOutlined } from '@ant-design/icons';
import { formatAddress, formatDate, formatTokenAmount } from '../utils/formatting';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

/**
 * Transaction status tag component
 * @param {string} status - Transaction status
 * @returns {JSX.Element} Colored tag based on status
 */
const TransactionStatusTag = ({ status }) => {
  let color;
  let icon;
  
  switch (status.toLowerCase()) {
    case 'confirmed':
      color = 'success';
      icon = <ArrowUpOutlined />;
      break;
    case 'pending':
      color = 'processing';
      break;
    case 'failed':
      color = 'error';
      icon = <ArrowDownOutlined />;
      break;
    default:
      color = 'default';
  }
  
  return (
    <Tag color={color} icon={icon}>
      {status}
    </Tag>
  );
};

/**
 * Transaction history component
 * @param {Object} props - Component props
 * @param {Array} props.transactions - List of transactions
 * @param {Function} props.onRefresh - Callback when refresh is requested
 * @param {boolean} props.loading - Whether data is loading
 * @param {string} props.networkId - Current network ID
 * @param {Function} props.onViewDetails - Callback when a transaction is selected for details
 * @returns {JSX.Element} Transaction history component
 */
const TransactionHistory = ({ 
  transactions = [], 
  onRefresh,
  loading = false,
  networkId,
  onViewDetails
}) => {
  const [filteredTransactions, setFilteredTransactions] = useState(transactions);
  const [filters, setFilters] = useState({
    type: 'all',
    token: 'all',
    status: 'all',
    dateRange: null,
    search: ''
  });
  
  // Explorer links based on network
  const getExplorerLink = (hash) => {
    let baseUrl = '';
    
    switch(networkId) {
      case '1':
        baseUrl = 'https://etherscan.io/tx/';
        break;
      case '137':
        baseUrl = 'https://polygonscan.com/tx/';
        break;
      case '5':
        baseUrl = 'https://goerli.etherscan.io/tx/';
        break;
      case '11155111':
        baseUrl = 'https://sepolia.etherscan.io/tx/';
        break;
      case '80001':
        baseUrl = 'https://mumbai.polygonscan.com/tx/';
        break;
      default:
        baseUrl = 'https://etherscan.io/tx/';
    }
    
    return `${baseUrl}${hash}`;
  };
  
  // Apply filters to transactions
  useEffect(() => {
    let result = [...transactions];
    
    // Filter by transaction type
    if (filters.type !== 'all') {
      result = result.filter(tx => tx.type.toLowerCase() === filters.type.toLowerCase());
    }
    
    // Filter by token
    if (filters.token !== 'all') {
      result = result.filter(tx => tx.token === filters.token);
    }
    
    // Filter by status
    if (filters.status !== 'all') {
      result = result.filter(tx => tx.status.toLowerCase() === filters.status.toLowerCase());
    }
    
    // Filter by date range
    if (filters.dateRange && filters.dateRange.length === 2) {
      const startTimestamp = filters.dateRange[0].startOf('day').valueOf();
      const endTimestamp = filters.dateRange[1].endOf('day').valueOf();
      
      result = result.filter(tx => {
        const txTimestamp = new Date(tx.timestamp).getTime();
        return txTimestamp >= startTimestamp && txTimestamp <= endTimestamp;
      });
    }
    
    // Filter by search (address or hash)
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(tx => 
        tx.hash.toLowerCase().includes(searchLower) || 
        (tx.from && tx.from.toLowerCase().includes(searchLower)) ||
        (tx.to && tx.to.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredTransactions(result);
  }, [transactions, filters]);
  
  // Table columns
  const columns = [
    {
      title: 'Date',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => formatDate(timestamp),
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'Transfer', value: 'transfer' },
        { text: 'Stake', value: 'stake' },
        { text: 'Unstake', value: 'unstake' },
        { text: 'Claim', value: 'claim' },
      ],
      onFilter: (value, record) => record.type.toLowerCase() === value.toLowerCase(),
      render: (type) => (
        <Text style={{ textTransform: 'capitalize' }}>{type}</Text>
      ),
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => formatTokenAmount(amount, record.token),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      render: (address) => address ? formatAddress(address) : '-',
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      render: (address) => address ? formatAddress(address) : '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      filters: [
        { text: 'Confirmed', value: 'confirmed' },
        { text: 'Pending', value: 'pending' },
        { text: 'Failed', value: 'failed' },
      ],
      onFilter: (value, record) => record.status.toLowerCase() === value.toLowerCase(),
      render: (status) => <TransactionStatusTag status={status} />,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="View on Explorer">
            <Button 
              type="text" 
              icon={<LinkOutlined />} 
              onClick={() => window.open(getExplorerLink(record.hash), '_blank')}
              size="small"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];
  
  return (
    <Card title={<Title level={4}>Transaction History</Title>}>
      <Space direction="vertical" style={{ width: '100%', marginBottom: 16 }}>
        <Space wrap>
          <Select
            placeholder="Transaction Type"
            value={filters.type}
            onChange={(value) => setFilters({...filters, type: value})}
            style={{ width: 140 }}
          >
            <Option value="all">All Types</Option>
            <Option value="transfer">Transfer</Option>
            <Option value="stake">Stake</Option>
            <Option value="unstake">Unstake</Option>
            <Option value="claim">Claim</Option>
          </Select>
          
          <Select
            placeholder="Token"
            value={filters.token}
            onChange={(value) => setFilters({...filters, token: value})}
            style={{ width: 120 }}
          >
            <Option value="all">All Tokens</Option>
            <Option value="SYN">SYN</Option>
            <Option value="AIP">AIP</Option>
          </Select>
          
          <Select
            placeholder="Status"
            value={filters.status}
            onChange={(value) => setFilters({...filters, status: value})}
            style={{ width: 140 }}
          >
            <Option value="all">All Statuses</Option>
            <Option value="confirmed">Confirmed</Option>
            <Option value="pending">Pending</Option>
            <Option value="failed">Failed</Option>
          </Select>
          
          <RangePicker 
            onChange={(dates) => setFilters({...filters, dateRange: dates})}
          />
          
          <Input
            placeholder="Search address or tx hash"
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
            prefix={<SearchOutlined />}
            style={{ width: 240 }}
          />
          
          <Button 
            icon={<ReloadOutlined />} 
            onClick={onRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          
          <Button 
            icon={<FilterOutlined />} 
            onClick={() => setFilters({
              type: 'all',
              token: 'all',
              status: 'all',
              dateRange: null,
              search: ''
            })}
          >
            Clear Filters
          </Button>
        </Space>
      </Space>
      
      <Table 
        columns={columns} 
        dataSource={filteredTransactions.map(tx => ({...tx, key: tx.hash}))} 
        loading={loading}
        pagination={{ pageSize: 10 }}
        onChange={(pagination, filters, sorter) => {
          // Table built-in sorting and filtering is handled here
        }}
        onRow={(record) => ({
          onClick: () => {
            if (onViewDetails) {
              onViewDetails(record);
            }
          },
          style: { cursor: 'pointer' }
        })}
        scroll={{ x: 'max-content' }}
      />
    </Card>
  );
};

export default TransactionHistory; 