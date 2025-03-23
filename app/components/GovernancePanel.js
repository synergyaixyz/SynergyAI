import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Tag,
  Space,
  Progress,
  Modal,
  Spin,
  Typography,
  Radio,
  message,
  Tabs,
  Input,
  Form
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  UserOutlined,
  CloseOutlined,
  PlusOutlined,
  SendOutlined
} from '@ant-design/icons';
import { ethers } from 'ethers';
import useWallet from '../hooks/useWallet';
import useGovernance from '../hooks/useGovernance';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { TextArea } = Input;

/**
 * GovernancePanel component
 * Displays list of governance proposals and allows users to vote
 */
const GovernancePanel = () => {
  const { address, isConnected, connectWallet, signMessage } = useWallet();
  const {
    proposals,
    loading,
    error,
    fetchProposals,
    castVote,
    delegateVotes,
    userVotingPower,
    fetchUserVotingPower
  } = useGovernance();

  const [selectedProposal, setSelectedProposal] = useState(null);
  const [voteModalVisible, setVoteModalVisible] = useState(false);
  const [voteOption, setVoteOption] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [delegateAddress, setDelegateAddress] = useState('');
  const [delegateModalVisible, setDelegateModalVisible] = useState(false);
  const [votingPower, setVotingPower] = useState('0');
  const [newProposalModalVisible, setNewProposalModalVisible] = useState(false);
  const [newProposal, setNewProposal] = useState({
    title: '',
    description: '',
  });
  const [submittingVote, setSubmittingVote] = useState(false);
  const [submittingDelegate, setSubmittingDelegate] = useState(false);
  const [submittingProposal, setSubmittingProposal] = useState(false);

  useEffect(() => {
    fetchProposals();
  }, []);

  useEffect(() => {
    if (isConnected) {
      fetchUserVotingPower().then(power => {
        setVotingPower(ethers.utils.formatEther(power));
      });
    }
  }, [isConnected, address]);

  const getProposalStatusTag = (proposal) => {
    const now = Math.floor(Date.now() / 1000);

    if (proposal.executed) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Executed</Tag>;
    }

    if (proposal.canceled) {
      return <Tag color="red" icon={<CloseCircleOutlined />}>Canceled</Tag>;
    }

    if (now < proposal.startTime) {
      return <Tag color="purple" icon={<ClockCircleOutlined />}>Pending</Tag>;
    }

    if (now > proposal.endTime) {
      const forVotes = ethers.BigNumber.from(proposal.forVotes);
      const againstVotes = ethers.BigNumber.from(proposal.againstVotes);

      if (forVotes.gt(againstVotes)) {
        return <Tag color="cyan" icon={<CheckCircleOutlined />}>Succeeded</Tag>;
      } else {
        return <Tag color="orange" icon={<CloseCircleOutlined />}>Defeated</Tag>;
      }
    }

    return <Tag color="blue" icon={<ClockCircleOutlined />}>Active</Tag>;
  };

  const getVotingProgress = (proposal) => {
    const forVotes = ethers.BigNumber.from(proposal.forVotes);
    const againstVotes = ethers.BigNumber.from(proposal.againstVotes);
    const totalVotes = forVotes.add(againstVotes);

    if (totalVotes.isZero()) {
      return 50; // If no votes, display as neutral
    }

    return Math.round(forVotes.mul(100).div(totalVotes).toNumber());
  };

  const handleVoteClick = (proposal) => {
    if (!isConnected) {
      message.warning('Please connect your wallet to vote');
      return;
    }

    setSelectedProposal(proposal);
    setVoteOption(null);
    setVoteModalVisible(true);
  };

  const handleVoteSubmit = async () => {
    if (!voteOption) {
      message.warning('Please select a vote option');
      return;
    }

    try {
      setSubmittingVote(true);
      const support = voteOption === 'for';
      const signature = await signMessage(`Vote ${support ? 'For' : 'Against'} Proposal ${selectedProposal.id}`);

      const result = await castVote(selectedProposal.id, support, signature);

      if (result.success) {
        message.success('Vote submitted successfully');
        setVoteModalVisible(false);
        fetchProposals(); // Refresh proposal list
      } else {
        message.error(result.error || 'Failed to submit vote');
      }
    } catch (error) {
      console.error('Vote submission error:', error);
      message.error('Failed to submit vote: ' + error.message);
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleDetailsClick = (proposal) => {
    setSelectedProposal(proposal);
    setDetailsModalVisible(true);
  };

  const handleDelegateSubmit = async () => {
    if (!ethers.utils.isAddress(delegateAddress)) {
      message.warning('Please enter a valid Ethereum address');
      return;
    }

    try {
      setSubmittingDelegate(true);
      const signature = await signMessage(`Delegate my voting power to ${delegateAddress}`);

      const result = await delegateVotes(delegateAddress, signature);

      if (result.success) {
        message.success('Voting power delegated successfully');
        setDelegateModalVisible(false);
        fetchUserVotingPower().then(power => {
          setVotingPower(ethers.utils.formatEther(power));
        });
      } else {
        message.error(result.error || 'Failed to delegate voting power');
      }
    } catch (error) {
      console.error('Delegation error:', error);
      message.error('Failed to delegate: ' + error.message);
    } finally {
      setSubmittingDelegate(false);
    }
  };

  const handleNewProposalSubmit = async () => {
    if (!newProposal.title.trim() || !newProposal.description.trim()) {
      message.warning('Please fill in all fields');
      return;
    }

    // In a real implementation, this would submit to the blockchain
    message.info('Creating a proposal would require integration with the blockchain. This is a mock interface.');
    setNewProposalModalVisible(false);
  };

  const handleTabChange = (key) => {
    // Could filter proposals based on tab selection
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60,
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <a onClick={() => handleDetailsClick(record)}>{text}</a>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: 120,
      render: (_, record) => getProposalStatusTag(record),
    },
    {
      title: 'Voting',
      key: 'voting',
      width: 180,
      render: (_, record) => {
        const progress = getVotingProgress(record);
        const forVotes = ethers.utils.formatEther(record.forVotes);
        const againstVotes = ethers.utils.formatEther(record.againstVotes);

        return (
          <div>
            <Progress
              percent={progress}
              size="small"
              status={progress > 50 ? "success" : "exception"}
              showInfo={false}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span>For: {parseFloat(forVotes).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              <span>Against: {parseFloat(againstVotes).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        );
      },
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) => {
        const now = Math.floor(Date.now() / 1000);
        const isActive = now >= record.startTime && now <= record.endTime;

        return (
          <Space size="small">
            <Button
              type="primary"
              size="small"
              onClick={() => handleVoteClick(record)}
              disabled={!isActive || !isConnected}
            >
              Vote
            </Button>
          </Space>
        );
      },
    },
  ];

  return (
    <div className="governance-panel">
      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={4}>Governance Proposals</Title>
            <Space>
              {isConnected ? (
                <>
                  <Tag color="green">Voting Power: {parseFloat(votingPower).toLocaleString(undefined, { maximumFractionDigits: 2 })}</Tag>
                  <Button onClick={() => setDelegateModalVisible(true)}>Delegate</Button>
                </>
              ) : (
                <Button type="primary" onClick={connectWallet}>Connect Wallet</Button>
              )}
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setNewProposalModalVisible(true)}
                disabled={!isConnected}
              >
                Create Proposal
              </Button>
            </Space>
          </div>
        }
        bordered={false}
      >
        <Tabs defaultActiveKey="1" onChange={handleTabChange}>
          <TabPane tab="All Proposals" key="1">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: '20px' }}>Loading proposals...</div>
              </div>
            ) : error ? (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <CloseCircleOutlined style={{ fontSize: '32px', color: '#ff4d4f' }} />
                <div style={{ marginTop: '20px' }}>Error loading proposals. Please try again.</div>
              </div>
            ) : (
              <Table
                dataSource={proposals}
                columns={columns}
                rowKey="id"
                pagination={{ pageSize: 10 }}
              />
            )}
          </TabPane>
          <TabPane tab="Active" key="2">
            <Table
              dataSource={proposals.filter(p => {
                const now = Math.floor(Date.now() / 1000);
                return now >= p.startTime && now <= p.endTime;
              })}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
          <TabPane tab="Completed" key="3">
            <Table
              dataSource={proposals.filter(p => {
                const now = Math.floor(Date.now() / 1000);
                return now > p.endTime || p.executed || p.canceled;
              })}
              columns={columns}
              rowKey="id"
              pagination={{ pageSize: 10 }}
            />
          </TabPane>
        </Tabs>
      </Card>

      {/* Vote Modal */}
      <Modal
        title="Cast Your Vote"
        visible={voteModalVisible}
        onCancel={() => setVoteModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setVoteModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingVote}
            onClick={handleVoteSubmit}
          >
            Submit Vote
          </Button>,
        ]}
      >
        {selectedProposal && (
          <>
            <Title level={5}>{selectedProposal.title}</Title>
            <div style={{ margin: '20px 0' }}>
              <Radio.Group onChange={(e) => setVoteOption(e.target.value)} value={voteOption}>
                <Space direction="vertical">
                  <Radio value="for">Vote For</Radio>
                  <Radio value="against">Vote Against</Radio>
                </Space>
              </Radio.Group>
            </div>
            <div style={{ marginTop: '15px' }}>
              <Text type="secondary">
                Your voting power: {parseFloat(votingPower).toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
            </div>
          </>
        )}
      </Modal>

      {/* Proposal Details Modal */}
      <Modal
        title="Proposal Details"
        visible={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          selectedProposal && (() => {
            const now = Math.floor(Date.now() / 1000);
            const isActive = now >= selectedProposal.startTime && now <= selectedProposal.endTime;

            return isActive && isConnected ? (
              <Button
                key="vote"
                type="primary"
                onClick={() => {
                  setDetailsModalVisible(false);
                  handleVoteClick(selectedProposal);
                }}
              >
                Vote
              </Button>
            ) : null;
          })(),
        ].filter(Boolean)}
        width={700}
      >
        {selectedProposal && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <Title level={4}>{selectedProposal.title}</Title>
              {getProposalStatusTag(selectedProposal)}
            </div>

            <Paragraph>
              <Text strong>Proposer: </Text>
              <Text>{`${selectedProposal.proposer.substring(0, 6)}...${selectedProposal.proposer.substring(38)}`}</Text>
            </Paragraph>

            <Paragraph>
              <Text strong>Voting Period: </Text>
              <Text>
                {new Date(selectedProposal.startTime * 1000).toLocaleString()} - {new Date(selectedProposal.endTime * 1000).toLocaleString()}
              </Text>
            </Paragraph>

            <Title level={5}>Description</Title>
            <Paragraph>
              {/* Mock description since we don't have it in the mock data */}
              This proposal aims to {selectedProposal.title.toLowerCase()}. It will require implementation changes
              in the smart contracts and governance system. The benefits include increased efficiency, better
              security, and improved user experience for all SynergyAI platform users.
            </Paragraph>

            <Title level={5}>Voting Results</Title>
            <div style={{ margin: '20px 0' }}>
              <Progress
                percent={getVotingProgress(selectedProposal)}
                status={getVotingProgress(selectedProposal) > 50 ? "success" : "exception"}
                format={percent => `${percent}%`}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                <Text>
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> For: {ethers.utils.formatEther(selectedProposal.forVotes)}
                </Text>
                <Text>
                  <CloseCircleOutlined style={{ color: '#ff4d4f' }} /> Against: {ethers.utils.formatEther(selectedProposal.againstVotes)}
                </Text>
              </div>
            </div>

            <Title level={5}>Technical Details</Title>
            <Paragraph>
              <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
                {`// Sample code or technical details
contract ProposalDetails {
    function execute() public {
        // Implementation of ${selectedProposal.title}
    }
}`}
              </pre>
            </Paragraph>
          </div>
        )}
      </Modal>

      {/* Delegate Modal */}
      <Modal
        title="Delegate Voting Power"
        visible={delegateModalVisible}
        onCancel={() => setDelegateModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setDelegateModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingDelegate}
            onClick={handleDelegateSubmit}
          >
            Delegate
          </Button>,
        ]}
      >
        <div style={{ marginBottom: '20px' }}>
          <Text>
            Current voting power: {parseFloat(votingPower).toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </Text>
        </div>
        <Form layout="vertical">
          <Form.Item label="Delegate Address" required>
            <Input
              placeholder="0x..."
              value={delegateAddress}
              onChange={(e) => setDelegateAddress(e.target.value)}
              prefix={<UserOutlined />}
            />
          </Form.Item>
          <div style={{ marginTop: '15px' }}>
            <Text type="secondary">
              You can delegate your voting power to another address. They will be able to vote on your behalf,
              but you will retain full ownership of your tokens.
            </Text>
          </div>
        </Form>
      </Modal>

      {/* New Proposal Modal */}
      <Modal
        title="Create New Proposal"
        visible={newProposalModalVisible}
        onCancel={() => setNewProposalModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setNewProposalModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={submittingProposal}
            onClick={handleNewProposalSubmit}
          >
            Submit Proposal
          </Button>,
        ]}
        width={700}
      >
        <Form layout="vertical">
          <Form.Item label="Title" required>
            <Input
              placeholder="Proposal title"
              value={newProposal.title}
              onChange={(e) => setNewProposal({...newProposal, title: e.target.value})}
            />
          </Form.Item>
          <Form.Item label="Description" required>
            <TextArea
              rows={6}
              placeholder="Detailed description of your proposal"
              value={newProposal.description}
              onChange={(e) => setNewProposal({...newProposal, description: e.target.value})}
            />
          </Form.Item>
          <div style={{ marginTop: '15px' }}>
            <Text type="secondary">
              Note: To create a proposal, you need to have at least 100,000 SYN tokens staked.
              Proposals will be subject to a 2-day review period before voting begins.
            </Text>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default GovernancePanel;
