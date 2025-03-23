import React, { useState, useEffect } from 'react';
import {
  Layout, Card, Button, Table, Tag, Tabs, Modal, Form,
  Input, Select, Spin, Alert, Progress, Space, Typography, Divider
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined,
  ThunderboltOutlined, FileTextOutlined,
  BarChartOutlined, LockOutlined, UnlockOutlined
} from '@ant-design/icons';
import useWallet from '../hooks/useWallet';
import providerService from '../services/providerService';
import { ethers } from 'ethers';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

// Mock governance contract ABI (will need to be replaced with actual ABI)
const GovernanceABI = [
  "function getProposals() view returns (tuple(uint256 id, string title, string description, address proposer, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, bool executed, bool canceled)[])",
  "function vote(uint256 proposalId, bool support) returns (bool)",
  "function createProposal(string memory title, string memory description) returns (uint256)",
  "function executeProposal(uint256 proposalId) returns (bool)",
  "function cancelProposal(uint256 proposalId) returns (bool)",
  "function getVotingPower(address voter) view returns (uint256)",
  "function hasVoted(uint256 proposalId, address voter) view returns (bool)",
  "function getProposalDetails(uint256 proposalId) view returns (tuple(uint256 id, string title, string description, address proposer, uint256 startTime, uint256 endTime, uint256 forVotes, uint256 againstVotes, bool executed, bool canceled, address[] targets, uint256[] values, string[] signatures, bytes[] calldatas))"
];

/**
 * Status enum for proposals
 */
const ProposalStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  SUCCEEDED: 'SUCCEEDED',
  DEFEATED: 'DEFEATED',
  EXECUTED: 'EXECUTED',
  CANCELED: 'CANCELED',
  EXPIRED: 'EXPIRED'
};

/**
 * Get proposal status based on its data
 * @param {Object} proposal - The proposal object
 * @returns {string} Status string
 */
function getProposalStatus(proposal) {
  const now = Math.floor(Date.now() / 1000);

  if (proposal.executed) return ProposalStatus.EXECUTED;
  if (proposal.canceled) return ProposalStatus.CANCELED;

  if (now < proposal.startTime) return ProposalStatus.PENDING;
  if (now <= proposal.endTime) return ProposalStatus.ACTIVE;

  if (now > proposal.endTime) {
    if (proposal.forVotes > proposal.againstVotes) return ProposalStatus.SUCCEEDED;
    return ProposalStatus.DEFEATED;
  }

  return ProposalStatus.EXPIRED;
}

/**
 * Get tag color based on proposal status
 * @param {string} status - The status string
 * @returns {string} Color string for Tag component
 */
function getStatusColor(status) {
  switch (status) {
    case ProposalStatus.PENDING: return 'blue';
    case ProposalStatus.ACTIVE: return 'green';
    case ProposalStatus.SUCCEEDED: return 'cyan';
    case ProposalStatus.DEFEATED: return 'red';
    case ProposalStatus.EXECUTED: return 'purple';
    case ProposalStatus.CANCELED: return 'orange';
    case ProposalStatus.EXPIRED: return 'gray';
    default: return 'default';
  }
}

/**
 * Governance Page Component
 */
export default function GovernancePage() {
  const { account, isConnected, connectWallet, networkId, signMessage } = useWallet();

  // State
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [votingPower, setVotingPower] = useState('0');
  const [errorMessage, setErrorMessage] = useState('');
  const [voteLoading, setVoteLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [executeLoading, setExecuteLoading] = useState(false);

  // Create form
  const [createForm] = Form.useForm();

  // Effect to load proposals
  useEffect(() => {
    if (isConnected) {
      loadProposals();
      loadVotingPower();
    }
  }, [isConnected, account, networkId]);

  /**
   * Load governance proposals from blockchain
   */
  const loadProposals = async () => {
    try {
      setLoading(true);
      setErrorMessage('');

      // In a real implementation, this would use the governance contract
      // For demo, we'll use mock data
      const mockProposals = [
        {
          id: 1,
          title: 'Add Support for Arbitrum Network',
          description: 'Proposal to add Arbitrum network support to SynergyAI, allowing users to deploy and interact with contracts on Arbitrum.',
          proposer: '0x1234567890123456789012345678901234567890',
          startTime: Math.floor(Date.now() / 1000) - 86400 * 5, // 5 days ago
          endTime: Math.floor(Date.now() / 1000) + 86400 * 2, // 2 days from now
          forVotes: ethers.utils.parseEther('15000'),
          againstVotes: ethers.utils.parseEther('5000'),
          executed: false,
          canceled: false
        },
        {
          id: 2,
          title: 'Increase Compute Task Reward Pool by 20%',
          description: 'Proposal to increase the reward pool for compute providers by 20% to incentivize more nodes to join the network.',
          proposer: '0x2345678901234567890123456789012345678901',
          startTime: Math.floor(Date.now() / 1000) - 86400 * 10, // 10 days ago
          endTime: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
          forVotes: ethers.utils.parseEther('25000'),
          againstVotes: ethers.utils.parseEther('12000'),
          executed: true,
          canceled: false
        },
        {
          id: 3,
          title: 'Implement ZK-STARK Verification for Task Results',
          description: 'Proposal to implement ZK-STARK verification for compute task results to enhance trust and accuracy of computation proofs.',
          proposer: '0x3456789012345678901234567890123456789012',
          startTime: Math.floor(Date.now() / 1000) - 86400 * 2, // 2 days ago
          endTime: Math.floor(Date.now() / 1000) + 86400 * 5, // 5 days from now
          forVotes: ethers.utils.parseEther('8000'),
          againstVotes: ethers.utils.parseEther('7000'),
          executed: false,
          canceled: false
        },
        {
          id: 4,
          title: 'Update SYN Token Staking Rewards Formula',
          description: 'Proposal to update the SYN token staking rewards formula to better align incentives with network growth and usage.',
          proposer: '0x4567890123456789012345678901234567890123',
          startTime: Math.floor(Date.now() / 1000) - 86400 * 7, // 7 days ago
          endTime: Math.floor(Date.now() / 1000) - 86400 * 1, // 1 day ago
          forVotes: ethers.utils.parseEther('18000'),
          againstVotes: ethers.utils.parseEther('22000'),
          executed: false,
          canceled: false
        },
        {
          id: 5,
          title: 'Treasury Diversification Strategy',
          description: 'Proposal to diversify treasury holdings across multiple stable assets to reduce volatility risks.',
          proposer: '0x5678901234567890123456789012345678901234',
          startTime: Math.floor(Date.now() / 1000) - 86400 * 3, // 3 days ago
          endTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
          forVotes: ethers.utils.parseEther('12000'),
          againstVotes: ethers.utils.parseEther('3000'),
          executed: false,
          canceled: false
        }
      ];

      setProposals(mockProposals);
    } catch (error) {
      console.error('Error loading proposals:', error);
      setErrorMessage('Failed to load proposals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load user's voting power
   */
  const loadVotingPower = async () => {
    try {
      if (!account) return;

      // In a real implementation, this would fetch from the governance contract
      // For demo, we'll use mock data
      const mockVotingPower = ethers.utils.parseEther('1000');
      setVotingPower(mockVotingPower);
    } catch (error) {
      console.error('Error loading voting power:', error);
    }
  };

  /**
   * Handle voting on a proposal
   * @param {number} proposalId - The proposal ID
   * @param {boolean} support - Whether the vote is in support
   */
  const handleVote = async (proposalId, support) => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet to vote');
      return;
    }

    try {
      setVoteLoading(true);

      // In a real implementation, this would call the vote function on the governance contract
      console.log(`Voting ${support ? 'for' : 'against'} proposal ${proposalId}`);

      // Mock success
      setTimeout(() => {
        // Update local state to simulate the vote
        const updatedProposals = proposals.map(p => {
          if (p.id === proposalId) {
            const updatedProposal = { ...p };
            if (support) {
              updatedProposal.forVotes = ethers.BigNumber.from(p.forVotes).add(votingPower).toString();
            } else {
              updatedProposal.againstVotes = ethers.BigNumber.from(p.againstVotes).add(votingPower).toString();
            }
            return updatedProposal;
          }
          return p;
        });

        setProposals(updatedProposals);
        setVoteLoading(false);
      }, 1500);

    } catch (error) {
      console.error('Error voting:', error);
      setErrorMessage('Failed to submit vote. Please try again.');
      setVoteLoading(false);
    }
  };

  /**
   * Handle creating a new proposal
   * @param {Object} values - Form values
   */
  const handleCreateProposal = async (values) => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet to create a proposal');
      return;
    }

    try {
      setCreateLoading(true);

      // In a real implementation, this would call the createProposal function
      console.log('Creating proposal:', values);

      // Mock success
      setTimeout(() => {
        // Create new proposal and add to state
        const newProposal = {
          id: proposals.length + 1,
          title: values.title,
          description: values.description,
          proposer: account,
          startTime: Math.floor(Date.now() / 1000),
          endTime: Math.floor(Date.now() / 1000) + 86400 * 7, // 7 days from now
          forVotes: ethers.utils.parseEther('0'),
          againstVotes: ethers.utils.parseEther('0'),
          executed: false,
          canceled: false
        };

        setProposals([...proposals, newProposal]);
        setCreateModalVisible(false);
        createForm.resetFields();
        setCreateLoading(false);
      }, 2000);

    } catch (error) {
      console.error('Error creating proposal:', error);
      setErrorMessage('Failed to create proposal. Please try again.');
      setCreateLoading(false);
    }
  };

  /**
   * Handle executing a proposal
   * @param {number} proposalId - The proposal ID
   */
  const handleExecuteProposal = async (proposalId) => {
    if (!isConnected) {
      setErrorMessage('Please connect your wallet to execute a proposal');
      return;
    }

    try {
      setExecuteLoading(true);

      // In a real implementation, this would call the executeProposal function
      console.log(`Executing proposal ${proposalId}`);

      // Mock success
      setTimeout(() => {
        // Update local state to mark proposal as executed
        const updatedProposals = proposals.map(p => {
          if (p.id === proposalId) {
            return { ...p, executed: true };
          }
          return p;
        });

        setProposals(updatedProposals);
        setDetailsModalVisible(false);
        setExecuteLoading(false);
      }, 2000);

    } catch (error) {
      console.error('Error executing proposal:', error);
      setErrorMessage('Failed to execute proposal. Please try again.');
      setExecuteLoading(false);
    }
  };

  /**
   * Show proposal details modal
   * @param {Object} proposal - The proposal to show
   */
  const showProposalDetails = (proposal) => {
    setSelectedProposal(proposal);
    setDetailsModalVisible(true);
  };

  // Table columns
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => showProposalDetails(record)}>{text}</a>
      )
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => {
        const status = getProposalStatus(record);
        return <Tag color={getStatusColor(status)}>{status}</Tag>;
      }
    },
    {
      title: 'Votes',
      key: 'votes',
      render: (_, record) => {
        const forVotes = ethers.utils.formatEther(record.forVotes);
        const againstVotes = ethers.utils.formatEther(record.againstVotes);
        const total = parseFloat(forVotes) + parseFloat(againstVotes);
        const forPercentage = total > 0 ? (parseFloat(forVotes) / total) * 100 : 0;

        return (
          <div>
            <Progress
              percent={forPercentage}
              size="small"
              format={() => `${parseFloat(forVotes).toLocaleString()} FOR`}
              style={{ marginBottom: 8 }}
            />
            <Progress
              percent={100 - forPercentage}
              size="small"
              strokeColor="#ff4d4f"
              format={() => `${parseFloat(againstVotes).toLocaleString()} AGAINST`}
            />
          </div>
        );
      }
    },
    {
      title: 'Time',
      key: 'time',
      render: (_, record) => {
        const status = getProposalStatus(record);
        const now = Math.floor(Date.now() / 1000);

        if (status === ProposalStatus.PENDING) {
          const days = Math.floor((record.startTime - now) / 86400);
          return `Starts in ${days} days`;
        }

        if (status === ProposalStatus.ACTIVE) {
          const days = Math.floor((record.endTime - now) / 86400);
          const hours = Math.floor(((record.endTime - now) % 86400) / 3600);
          return `${days}d ${hours}h remaining`;
        }

        if (status === ProposalStatus.EXECUTED) {
          return 'Executed';
        }

        if (status === ProposalStatus.CANCELED) {
          return 'Canceled';
        }

        const endDate = new Date(record.endTime * 1000).toLocaleDateString();
        return `Ended on ${endDate}`;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => {
        const status = getProposalStatus(record);

        if (status === ProposalStatus.ACTIVE) {
          return (
            <Space>
              <Button
                type="primary"
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleVote(record.id, true)}
                loading={voteLoading}
              >
                For
              </Button>
              <Button
                danger
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={() => handleVote(record.id, false)}
                loading={voteLoading}
              >
                Against
              </Button>
            </Space>
          );
        }

        return (
          <Button
            type="default"
            size="small"
            onClick={() => showProposalDetails(record)}
          >
            Details
          </Button>
        );
      }
    }
  ];

  // Tabs content
  const tabItems = [
    {
      key: 'all',
      tab: 'All Proposals',
      content: (
        <Table
          columns={columns}
          dataSource={proposals}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      )
    },
    {
      key: 'active',
      tab: 'Active',
      content: (
        <Table
          columns={columns}
          dataSource={proposals.filter(p => getProposalStatus(p) === ProposalStatus.ACTIVE)}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      )
    },
    {
      key: 'pending',
      tab: 'Pending',
      content: (
        <Table
          columns={columns}
          dataSource={proposals.filter(p => getProposalStatus(p) === ProposalStatus.PENDING)}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      )
    },
    {
      key: 'closed',
      tab: 'Closed',
      content: (
        <Table
          columns={columns}
          dataSource={proposals.filter(p => {
            const status = getProposalStatus(p);
            return [
              ProposalStatus.SUCCEEDED,
              ProposalStatus.DEFEATED,
              ProposalStatus.EXECUTED,
              ProposalStatus.CANCELED,
              ProposalStatus.EXPIRED
            ].includes(status);
          })}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      )
    }
  ];

  return (
    <Layout.Content style={{ padding: '30px 50px', minHeight: 'calc(100vh - 64px - 69px)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <Title level={2}>Governance</Title>

        <div style={{ marginBottom: 24 }}>
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Title level={4}>SynergyAI DAO</Title>
                <Text>Decentralized governance for the SynergyAI protocol</Text>
              </div>
              <div>
                {isConnected ? (
                  <Space direction="vertical" align="end">
                    <Text strong>Your Voting Power</Text>
                    <Title level={3}>{parseFloat(ethers.utils.formatEther(votingPower)).toLocaleString()} SYN</Title>
                    <Button
                      type="primary"
                      icon={<FileTextOutlined />}
                      onClick={() => setCreateModalVisible(true)}
                    >
                      Create Proposal
                    </Button>
                  </Space>
                ) : (
                  <Button type="primary" onClick={connectWallet}>Connect Wallet to Participate</Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {errorMessage && (
          <Alert
            message={errorMessage}
            type="error"
            showIcon
            closable
            onClose={() => setErrorMessage('')}
            style={{ marginBottom: 24 }}
          />
        )}

        <Card>
          <Tabs defaultActiveKey="all">
            {tabItems.map(item => (
              <TabPane tab={item.tab} key={item.key}>
                {item.content}
              </TabPane>
            ))}
          </Tabs>
        </Card>
      </div>

      {/* Create Proposal Modal */}
      <Modal
        title="Create Proposal"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateProposal}
        >
          <Form.Item
            name="title"
            label="Proposal Title"
            rules={[
              { required: true, message: 'Please enter a title for your proposal' },
              { max: 100, message: 'Title must be less than 100 characters' }
            ]}
          >
            <Input placeholder="Enter a clear, concise title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Proposal Description"
            rules={[
              { required: true, message: 'Please enter a description for your proposal' },
              { min: 100, message: 'Description must be at least 100 characters' }
            ]}
          >
            <Input.TextArea
              placeholder="Provide a detailed description of what this proposal aims to accomplish..."
              rows={6}
            />
          </Form.Item>

          <Form.Item
            name="proposalType"
            label="Proposal Type"
            rules={[{ required: true, message: 'Please select a proposal type' }]}
          >
            <Select placeholder="Select proposal type">
              <Option value="parameter">Parameter Change</Option>
              <Option value="funding">Funding Request</Option>
              <Option value="upgrade">Protocol Upgrade</Option>
              <Option value="integration">New Integration</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>

          <Divider />

          <div style={{ marginBottom: 16 }}>
            <Text strong style={{ fontSize: 16 }}>Before you submit:</Text>
            <ul>
              <li>Ensure your proposal aligns with the SynergyAI mission and values</li>
              <li>Check that you have sufficient voting power to submit a proposal</li>
              <li>Review related proposals to avoid duplication</li>
              <li>Be specific about implementation details when applicable</li>
            </ul>
          </div>

          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                style={{ marginRight: 8 }}
                onClick={() => setCreateModalVisible(false)}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createLoading}
              >
                Submit Proposal
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Proposal Details Modal */}
      {selectedProposal && (
        <Modal
          title={`Proposal #${selectedProposal.id}`}
          open={detailsModalVisible}
          onCancel={() => setDetailsModalVisible(false)}
          footer={null}
          width={800}
        >
          <Card>
            <Title level={4}>{selectedProposal.title}</Title>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <Space>
                <Tag color={getStatusColor(getProposalStatus(selectedProposal))}>
                  {getProposalStatus(selectedProposal)}
                </Tag>
                <Text type="secondary">
                  Proposed by {selectedProposal.proposer.slice(0, 6)}...{selectedProposal.proposer.slice(-4)}
                </Text>
              </Space>

              <Text type="secondary">
                {new Date(selectedProposal.startTime * 1000).toLocaleDateString()} - {new Date(selectedProposal.endTime * 1000).toLocaleDateString()}
              </Text>
            </div>

            <Divider />

            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {selectedProposal.description}
            </Paragraph>

            <Divider />

            <Title level={5}>Voting Results</Title>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text strong>For</Text>
                <Text strong>{parseFloat(ethers.utils.formatEther(selectedProposal.forVotes)).toLocaleString()} SYN</Text>
              </div>
              <Progress
                percent={100}
                strokeColor="#52c41a"
                showInfo={false}
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
                <Text strong>Against</Text>
                <Text strong>{parseFloat(ethers.utils.formatEther(selectedProposal.againstVotes)).toLocaleString()} SYN</Text>
              </div>
              <Progress
                percent={100}
                strokeColor="#ff4d4f"
                showInfo={false}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
              {getProposalStatus(selectedProposal) === ProposalStatus.ACTIVE && (
                <Space>
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleVote(selectedProposal.id, true)}
                    loading={voteLoading}
                  >
                    Vote For
                  </Button>
                  <Button
                    danger
                    icon={<CloseCircleOutlined />}
                    onClick={() => handleVote(selectedProposal.id, false)}
                    loading={voteLoading}
                  >
                    Vote Against
                  </Button>
                </Space>
              )}

              {getProposalStatus(selectedProposal) === ProposalStatus.SUCCEEDED && (
                <Button
                  type="primary"
                  icon={<ThunderboltOutlined />}
                  onClick={() => handleExecuteProposal(selectedProposal.id)}
                  loading={executeLoading}
                >
                  Execute Proposal
                </Button>
              )}

              {getProposalStatus(selectedProposal) === ProposalStatus.EXECUTED && (
                <Tag color="purple" icon={<CheckCircleOutlined />}>Executed Successfully</Tag>
              )}
            </div>
          </Card>
        </Modal>
      )}
    </Layout.Content>
  );
}
