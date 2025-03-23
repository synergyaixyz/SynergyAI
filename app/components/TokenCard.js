/**
 * Token card component
 * Displays token information in a card format
 */

import React, { useState } from 'react';
import { Card, Button, Typography, Space, Tag, Progress, Tooltip, Spin, Modal, Input, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, SwapOutlined, LockOutlined, UnlockOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';
import { formatTokenAmount } from '../utils/formatting';
import { transferTokens, stakeTokens, unstakeTokens } from '../blockchain/contracts/Tokens';

const { Title, Text } = Typography;

/**
 * Token card component
 * @param {Object} props - Component props
 * @param {string} props.tokenSymbol - Token symbol (SYN or AIP)
 * @param {string} props.tokenName - Full token name
 * @param {string} props.balance - Token balance
 * @param {string} props.stakedAmount - Amount staked (only for SYN)
 * @param {string} props.usdValue - USD value of the token
 * @param {number} props.priceChange - Price change percentage
 * @param {Object} props.signer - Ethers signer
 * @param {string} props.networkId - Network ID
 * @param {Function} props.onTransactionComplete - Callback when transaction completes
 * @param {string} props.tokenDescription - Token description
 * @param {string} props.tokenLogo - URL to token logo
 * @returns {JSX.Element} Token card component
 */
const TokenCard = ({
  tokenSymbol,
  tokenName,
  balance,
  stakedAmount,
  usdValue,
  priceChange,
  signer,
  networkId,
  onTransactionComplete,
  tokenDescription,
  tokenLogo
}) => {
  const [loading, setLoading] = useState(false);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [stakeModalVisible, setStakeModalVisible] = useState(false);
  const [unstakeModalVisible, setUnstakeModalVisible] = useState(false);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAddress, setTransferAddress] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  // Format numbers for display
  const formattedBalance = formatTokenAmount(balance, tokenSymbol);
  const formattedStakedAmount = stakedAmount ? formatTokenAmount(stakedAmount, tokenSymbol) : null;
  const formattedUsdValue = `$${Number(usdValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // Calculate stake percentage for SYN tokens
  const stakePercentage = stakedAmount && balance 
    ? (Number(stakedAmount) / (Number(balance) + Number(stakedAmount)) * 100).toFixed(2)
    : 0;
  
  // Determine price change color
  const priceChangeColor = priceChange > 0 ? '#52c41a' : priceChange < 0 ? '#f5222d' : 'gray';
  
  // Handle token transfer
  const handleTransfer = async () => {
    if (!transferAmount || !transferAddress) {
      message.error('Please enter both amount and address');
      return;
    }
    
    try {
      if (!ethers.utils.isAddress(transferAddress)) {
        message.error('Invalid Ethereum address');
        return;
      }
      
      // Convert to wei
      const amountInWei = ethers.utils.parseEther(transferAmount);
      
      setLoading(true);
      const tx = await transferTokens(tokenSymbol, transferAddress, amountInWei, signer, networkId);
      await tx.wait();
      
      message.success(`Successfully transferred ${transferAmount} ${tokenSymbol}`);
      setTransferModalVisible(false);
      setTransferAmount('');
      setTransferAddress('');
      
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Transfer error:', error);
      message.error(`Transfer failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle token staking (SYN only)
  const handleStake = async () => {
    if (!stakeAmount) {
      message.error('Please enter an amount to stake');
      return;
    }
    
    try {
      // Convert to wei
      const amountInWei = ethers.utils.parseEther(stakeAmount);
      
      setLoading(true);
      const tx = await stakeTokens(amountInWei, signer, networkId);
      await tx.wait();
      
      message.success(`Successfully staked ${stakeAmount} ${tokenSymbol}`);
      setStakeModalVisible(false);
      setStakeAmount('');
      
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Staking error:', error);
      message.error(`Staking failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle token unstaking (SYN only)
  const handleUnstake = async () => {
    if (!unstakeAmount) {
      message.error('Please enter an amount to unstake');
      return;
    }
    
    try {
      // Convert to wei
      const amountInWei = ethers.utils.parseEther(unstakeAmount);
      
      setLoading(true);
      const tx = await unstakeTokens(amountInWei, signer, networkId);
      await tx.wait();
      
      message.success(`Successfully unstaked ${unstakeAmount} ${tokenSymbol}`);
      setUnstakeModalVisible(false);
      setUnstakeAmount('');
      
      if (onTransactionComplete) {
        onTransactionComplete();
      }
    } catch (error) {
      console.error('Unstaking error:', error);
      message.error(`Unstaking failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Spin spinning={loading}>
      <Card 
        title={
          <Space>
            {tokenLogo && <img src={tokenLogo} alt={tokenSymbol} style={{ width: 24, height: 24 }} />}
            <Title level={4} style={{ margin: 0 }}>{tokenName} ({tokenSymbol})</Title>
          </Space>
        }
        extra={
          <Tag color={priceChangeColor}>
            {priceChange > 0 ? <ArrowUpOutlined /> : priceChange < 0 ? <ArrowDownOutlined /> : null}
            {priceChange > 0 ? '+' : ''}{priceChange}%
          </Tag>
        }
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">Balance:</Text>
            <Title level={3} style={{ margin: '0 0 8px 0' }}>{formattedBalance}</Title>
            <Text type="secondary">{formattedUsdValue}</Text>
          </div>
          
          {tokenSymbol === 'SYN' && (
            <>
              <div style={{ marginTop: 16 }}>
                <Space>
                  <Text type="secondary">Staked:</Text>
                  <Tooltip title="Staked tokens earn rewards but cannot be transferred until unstaked">
                    <QuestionCircleOutlined />
                  </Tooltip>
                </Space>
                <Title level={4} style={{ margin: '0 0 8px 0' }}>{formattedStakedAmount}</Title>
                <Progress 
                  percent={stakePercentage} 
                  size="small" 
                  status="active"
                  format={() => `${stakePercentage}%`}
                />
              </div>
            </>
          )}
          
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">{tokenDescription}</Text>
          </div>
          
          <Space style={{ marginTop: 24 }}>
            <Button 
              type="primary" 
              icon={<SwapOutlined />}
              onClick={() => setTransferModalVisible(true)}
              disabled={!signer || Number(balance) <= 0}
            >
              Transfer
            </Button>
            
            {tokenSymbol === 'SYN' && (
              <>
                <Button 
                  type="default" 
                  icon={<LockOutlined />}
                  onClick={() => setStakeModalVisible(true)}
                  disabled={!signer || Number(balance) <= 0}
                >
                  Stake
                </Button>
                
                <Button 
                  type="default" 
                  icon={<UnlockOutlined />}
                  onClick={() => setUnstakeModalVisible(true)}
                  disabled={!signer || Number(stakedAmount) <= 0}
                >
                  Unstake
                </Button>
              </>
            )}
          </Space>
        </Space>
      </Card>
      
      {/* Transfer Modal */}
      <Modal
        title={`Transfer ${tokenSymbol}`}
        open={transferModalVisible}
        onCancel={() => setTransferModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setTransferModalVisible(false)}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleTransfer}
            loading={loading}
            disabled={!transferAmount || !transferAddress}
          >
            Transfer
          </Button>
        ]}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Available: {formattedBalance}</Text>
          <Input
            placeholder="Recipient Address"
            value={transferAddress}
            onChange={(e) => setTransferAddress(e.target.value)}
            style={{ marginBottom: 16 }}
          />
          <Input
            placeholder="Amount"
            value={transferAmount}
            onChange={(e) => setTransferAmount(e.target.value)}
            suffix={tokenSymbol}
            type="number"
            min="0"
            step="0.01"
          />
        </Space>
      </Modal>
      
      {/* Stake Modal */}
      {tokenSymbol === 'SYN' && (
        <Modal
          title="Stake SYN Tokens"
          open={stakeModalVisible}
          onCancel={() => setStakeModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setStakeModalVisible(false)}>
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleStake}
              loading={loading}
              disabled={!stakeAmount}
            >
              Stake
            </Button>
          ]}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Available: {formattedBalance}</Text>
            <Text type="secondary">
              Staking locks your tokens and earns rewards. Staked tokens cannot be transferred until unstaked.
            </Text>
            <Input
              placeholder="Amount"
              value={stakeAmount}
              onChange={(e) => setStakeAmount(e.target.value)}
              suffix="SYN"
              type="number"
              min="0"
              step="0.01"
              style={{ marginTop: 16 }}
            />
          </Space>
        </Modal>
      )}
      
      {/* Unstake Modal */}
      {tokenSymbol === 'SYN' && (
        <Modal
          title="Unstake SYN Tokens"
          open={unstakeModalVisible}
          onCancel={() => setUnstakeModalVisible(false)}
          footer={[
            <Button key="cancel" onClick={() => setUnstakeModalVisible(false)}>
              Cancel
            </Button>,
            <Button 
              key="submit" 
              type="primary" 
              onClick={handleUnstake}
              loading={loading}
              disabled={!unstakeAmount}
            >
              Unstake
            </Button>
          ]}
        >
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Staked: {formattedStakedAmount}</Text>
            <Text type="secondary">
              Unstaking returns your tokens to your available balance, but you will stop earning rewards on unstaked tokens.
            </Text>
            <Input
              placeholder="Amount"
              value={unstakeAmount}
              onChange={(e) => setUnstakeAmount(e.target.value)}
              suffix="SYN"
              type="number"
              min="0"
              step="0.01"
              style={{ marginTop: 16 }}
            />
          </Space>
        </Modal>
      )}
    </Spin>
  );
};

export default TokenCard; 