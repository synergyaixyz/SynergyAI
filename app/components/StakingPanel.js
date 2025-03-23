/**
 * Staking panel component
 * Provides UI for staking SYN tokens and viewing staking rewards
 */

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Button, Statistic, Progress, Space, Divider, InputNumber, Form, Alert, Tooltip, Spin } from 'antd';
import { LockOutlined, UnlockOutlined, QuestionCircleOutlined, TrophyOutlined, CalculatorOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { formatTokenAmount } from '../utils/formatting';
import { stakeTokens, unstakeTokens, claimRewards, getRewards } from '../blockchain/contracts/Tokens';

const { Title, Text, Paragraph } = Typography;

/**
 * Staking panel component
 * @param {Object} props - Component props
 * @param {string} props.synBalance - Current SYN token balance
 * @param {string} props.stakedAmount - Amount of SYN tokens currently staked
 * @param {Object} props.signer - Ethers signer
 * @param {string} props.networkId - Network ID
 * @param {string} props.account - User's account address
 * @param {Object} props.provider - Ethers provider
 * @param {Function} props.onTransactionComplete - Callback when transaction completes
 * @returns {JSX.Element} Staking panel component
 */
const StakingPanel = ({
  synBalance = '0',
  stakedAmount = '0',
  signer,
  networkId,
  account,
  provider,
  onTransactionComplete
}) => {
  const [loadingRewards, setLoadingRewards] = useState(false);
  const [loadingStake, setLoadingStake] = useState(false);
  const [loadingUnstake, setLoadingUnstake] = useState(false);
  const [loadingClaim, setLoadingClaim] = useState(false);
  const [rewards, setRewards] = useState('0');
  const [stakeForm] = Form.useForm();
  const [unstakeForm] = Form.useForm();
  const [aprRate, setAprRate] = useState(15); // Hardcoded APR for now, should be fetched from contract
  
  // Convert string balances to numbers for calculations
  const synBalanceNum = Number(synBalance);
  const stakedAmountNum = Number(stakedAmount);
  const totalSynNum = synBalanceNum + stakedAmountNum;
  
  // Calculate staking percentage
  const stakingPercentage = totalSynNum > 0 ? (stakedAmountNum / totalSynNum) * 100 : 0;
  
  // Calculate estimated daily rewards
  const dailyRewardRate = aprRate / 365;
  const estimatedDailyRewards = (stakedAmountNum * dailyRewardRate) / 100;
  
  // Get user rewards
  const fetchRewards = async () => {
    if (!account || !provider || !networkId) {
      return;
    }
    
    try {
      setLoadingRewards(true);
      const rewardsWei = await getRewards(account, provider, networkId);
      const rewardsEth = ethers.utils.formatEther(rewardsWei);
      setRewards(rewardsEth);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoadingRewards(false);
    }
  };
  
  // Fetch rewards when account, provider, or networkId changes
  useEffect(() => {
    fetchRewards();
    // Set up a timer to refresh rewards every minute
    const timer = setInterval(fetchRewards, 60000);
    return () => clearInterval(timer);
  }, [account, provider, networkId]);
  
  // Handle staking tokens
  const handleStake = async (values) => {
    const { stakeAmount } = values;
    
    if (!stakeAmount || stakeAmount <= 0) {
      return;
    }
    
    try {
      setLoadingStake(true);
      const amountWei = ethers.utils.parseEther(stakeAmount.toString());
      const tx = await stakeTokens(amountWei, signer, networkId);
      await tx.wait();
      
      stakeForm.resetFields();
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Error staking tokens:', error);
    } finally {
      setLoadingStake(false);
    }
  };
  
  // Handle unstaking tokens
  const handleUnstake = async (values) => {
    const { unstakeAmount } = values;
    
    if (!unstakeAmount || unstakeAmount <= 0) {
      return;
    }
    
    try {
      setLoadingUnstake(true);
      const amountWei = ethers.utils.parseEther(unstakeAmount.toString());
      const tx = await unstakeTokens(amountWei, signer, networkId);
      await tx.wait();
      
      unstakeForm.resetFields();
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Error unstaking tokens:', error);
    } finally {
      setLoadingUnstake(false);
    }
  };
  
  // Handle claiming rewards
  const handleClaimRewards = async () => {
    try {
      setLoadingClaim(true);
      const tx = await claimRewards(signer, networkId);
      await tx.wait();
      
      // Refresh rewards after claiming
      await fetchRewards();
      
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Error claiming rewards:', error);
    } finally {
      setLoadingClaim(false);
    }
  };
  
  return (
    <Card>
      <Title level={4}>SYN Token Staking</Title>
      <Paragraph>
        Stake your SYN tokens to earn rewards and participate in governance decisions.
        Staked tokens are locked and cannot be transferred until unstaked.
      </Paragraph>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card title="Your Staking Stats" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Statistic
                title="Total SYN Tokens"
                value={formatTokenAmount(totalSynNum.toString(), 'SYN')}
                precision={4}
              />
              
              <Divider style={{ margin: '12px 0' }} />
              
              <Space>
                <Statistic
                  title="Available Balance"
                  value={formatTokenAmount(synBalance, 'SYN')}
                  precision={4}
                  style={{ marginRight: 24 }}
                />
                
                <Statistic
                  title="Staked Balance"
                  value={formatTokenAmount(stakedAmount, 'SYN')}
                  precision={4}
                />
              </Space>
              
              <Divider style={{ margin: '12px 0' }} />
              
              <div>
                <Space align="center">
                  <Text>Staking Percentage</Text>
                  <Tooltip title="Percentage of your SYN tokens that are currently staked">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
                <Progress 
                  percent={parseFloat(stakingPercentage.toFixed(2))} 
                  size="small" 
                  status="active"
                  format={(percent) => `${percent}%`}
                  style={{ marginTop: 8 }}
                />
              </div>
            </Space>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card title="Rewards" bordered={false}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Spin spinning={loadingRewards}>
                <Statistic
                  title="Available Rewards"
                  value={formatTokenAmount(rewards, 'SYN')}
                  precision={6}
                  prefix={<TrophyOutlined />}
                  style={{ marginBottom: 16 }}
                />
              </Spin>
              
              <Button 
                type="primary" 
                icon={<TrophyOutlined />}
                disabled={!signer || Number(rewards) <= 0}
                loading={loadingClaim}
                onClick={handleClaimRewards}
                block
              >
                Claim Rewards
              </Button>
              
              <Divider style={{ margin: '16px 0' }} />
              
              <Space align="center">
                <Text>Annual Percentage Rate (APR)</Text>
                <Tooltip title="The annual rate of return for staking SYN tokens">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
              <Title level={3} style={{ margin: '8px 0 16px' }}>{aprRate}%</Title>
              
              <Space align="center">
                <Text>Estimated Daily Rewards</Text>
                <Tooltip title="Estimated SYN tokens earned per day based on your current staked amount">
                  <QuestionCircleOutlined />
                </Tooltip>
              </Space>
              <Statistic
                value={formatTokenAmount(estimatedDailyRewards.toString(), 'SYN')}
                precision={6}
                prefix={<CalculatorOutlined />}
              />
            </Space>
          </Card>
        </Col>
      </Row>
      
      <Divider />
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <LockOutlined />
                <span>Stake Tokens</span>
              </Space>
            }
            bordered={false}
          >
            <Form
              form={stakeForm}
              onFinish={handleStake}
              layout="vertical"
            >
              <Form.Item
                name="stakeAmount"
                label="Amount to Stake"
                rules={[
                  { required: true, message: 'Please enter an amount' },
                  {
                    validator: (_, value) => {
                      if (value > synBalanceNum) {
                        return Promise.reject('Insufficient balance');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={synBalanceNum}
                  precision={4}
                  placeholder="Enter amount"
                  addonAfter="SYN"
                  disabled={!signer || synBalanceNum <= 0}
                />
              </Form.Item>
              
              <Space style={{ marginBottom: 16 }}>
                <Button
                  size="small"
                  onClick={() => stakeForm.setFieldsValue({ stakeAmount: synBalanceNum * 0.25 })}
                >
                  25%
                </Button>
                <Button
                  size="small"
                  onClick={() => stakeForm.setFieldsValue({ stakeAmount: synBalanceNum * 0.5 })}
                >
                  50%
                </Button>
                <Button
                  size="small"
                  onClick={() => stakeForm.setFieldsValue({ stakeAmount: synBalanceNum * 0.75 })}
                >
                  75%
                </Button>
                <Button
                  size="small"
                  onClick={() => stakeForm.setFieldsValue({ stakeAmount: synBalanceNum })}
                >
                  Max
                </Button>
              </Space>
              
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Available Balance: {formatTokenAmount(synBalance, 'SYN')}
              </Text>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  icon={<LockOutlined />}
                  loading={loadingStake}
                  disabled={!signer || synBalanceNum <= 0}
                >
                  Stake
                </Button>
              </Form.Item>
              
              <Alert
                message="Staking Information"
                description="Staked tokens earn rewards based on the current APR, but cannot be transferred until unstaked. There is no minimum lock period."
                type="info"
                showIcon
              />
            </Form>
          </Card>
        </Col>
        
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <UnlockOutlined />
                <span>Unstake Tokens</span>
              </Space>
            }
            bordered={false}
          >
            <Form
              form={unstakeForm}
              onFinish={handleUnstake}
              layout="vertical"
            >
              <Form.Item
                name="unstakeAmount"
                label="Amount to Unstake"
                rules={[
                  { required: true, message: 'Please enter an amount' },
                  {
                    validator: (_, value) => {
                      if (value > stakedAmountNum) {
                        return Promise.reject('Insufficient staked balance');
                      }
                      return Promise.resolve();
                    }
                  }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  max={stakedAmountNum}
                  precision={4}
                  placeholder="Enter amount"
                  addonAfter="SYN"
                  disabled={!signer || stakedAmountNum <= 0}
                />
              </Form.Item>
              
              <Space style={{ marginBottom: 16 }}>
                <Button
                  size="small"
                  onClick={() => unstakeForm.setFieldsValue({ unstakeAmount: stakedAmountNum * 0.25 })}
                >
                  25%
                </Button>
                <Button
                  size="small"
                  onClick={() => unstakeForm.setFieldsValue({ unstakeAmount: stakedAmountNum * 0.5 })}
                >
                  50%
                </Button>
                <Button
                  size="small"
                  onClick={() => unstakeForm.setFieldsValue({ unstakeAmount: stakedAmountNum * 0.75 })}
                >
                  75%
                </Button>
                <Button
                  size="small"
                  onClick={() => unstakeForm.setFieldsValue({ unstakeAmount: stakedAmountNum })}
                >
                  Max
                </Button>
              </Space>
              
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Staked Balance: {formatTokenAmount(stakedAmount, 'SYN')}
              </Text>
              
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  icon={<UnlockOutlined />}
                  loading={loadingUnstake}
                  disabled={!signer || stakedAmountNum <= 0}
                >
                  Unstake
                </Button>
              </Form.Item>
              
              <Alert
                message="Unstaking Information"
                description="Unstaking returns your tokens to your available balance, but you will stop earning rewards on the unstaked amount. Any pending rewards should be claimed before unstaking."
                type="info"
                showIcon
              />
            </Form>
          </Card>
        </Col>
      </Row>
    </Card>
  );
};

export default StakingPanel; 