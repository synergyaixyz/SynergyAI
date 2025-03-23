/**
 * Token Page Component
 * Displays token balance, staking options, and transaction history
 */

import React, { useState, useEffect, useContext } from 'react';
import { Tabs, Row, Col, Alert, Button, Typography, Spin, Space, Empty } from 'antd';
import { WalletOutlined, LineChartOutlined, HistoryOutlined, BankOutlined } from '@ant-design/icons';
import { ethers } from 'ethers';

// Import components
import TokenCard from '../components/TokenCard';
import TransactionHistory from '../components/TransactionHistory';
import StakingPanel from '../components/StakingPanel';

// Import blockchain helpers
import { Web3Context } from '../blockchain/web3Context';
import { getTokenBalance, getStakedAmount } from '../blockchain/contracts/Tokens';

// Import utilities
import { formatDate } from '../utils/formatting';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

/**
 * Token Page Component
 * @returns {JSX.Element} Token page component
 */
const TokensPage = () => {
  // Web3 context for blockchain interactions
  const { account, provider, networkId, networkName, isValidNetwork, chainChanged, connectWallet, signer } = useContext(Web3Context);
  
  // State variables
  const [synBalance, setSynBalance] = useState('0');
  const [aipBalance, setAipBalance] = useState('0');
  const [stakedAmount, setStakedAmount] = useState('0');
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transactionLoading, setTransactionLoading] = useState(false);
  
  // Price information (in future this would come from an API)
  const tokenPrices = {
    SYN: 2.45,
    AIP: 0.78
  };
  
  const priceChanges = {
    SYN: 5.2,
    AIP: -1.8
  };
  
  // Token descriptions
  const tokenDescriptions = {
    SYN: "SYN is the governance and utility token of the SynergyAI platform. It can be staked to earn rewards and participate in protocol governance.",
    AIP: "AIP (AI Power) is a utility token used for accessing computation resources, running AI models, and paying for services on the SynergyAI platform."
  };

  // Token logos (placeholder URLs)
  const tokenLogos = {
    SYN: "/images/syn-token-logo.svg",
    AIP: "/images/aip-token-logo.svg"
  };
  
  // Reset state when network changes
  useEffect(() => {
    setSynBalance('0');
    setAipBalance('0');
    setStakedAmount('0');
    setTransactions([]);
    
    if (account && isValidNetwork) {
      fetchBalances();
      fetchTransactions();
    }
  }, [account, networkId, chainChanged]);
  
  // Fetch token balances
  const fetchBalances = async () => {
    if (!account || !provider || !isValidNetwork) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Get token balances
      const synBalanceWei = await getTokenBalance('SYN', account, provider, networkId);
      const aipBalanceWei = await getTokenBalance('AIP', account, provider, networkId);
      const stakedAmountWei = await getStakedAmount(account, provider, networkId);
      
      // Convert from wei to ether
      const synBalanceEth = ethers.utils.formatEther(synBalanceWei);
      const aipBalanceEth = ethers.utils.formatEther(aipBalanceWei);
      const stakedAmountEth = ethers.utils.formatEther(stakedAmountWei);
      
      setSynBalance(synBalanceEth);
      setAipBalance(aipBalanceEth);
      setStakedAmount(stakedAmountEth);
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Generate sample transaction data (would be replaced by actual blockchain data)
  const fetchTransactions = async () => {
    if (!account || !isValidNetwork) {
      return;
    }
    
    try {
      setTransactionLoading(true);
      
      // Generate mock transaction data for demonstration
      // In a real app, this would fetch transaction history from an API or blockchain
      const mockTransactions = generateMockTransactions(20);
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setTransactionLoading(false);
    }
  };
  
  // Generate mock transaction data
  const generateMockTransactions = (count) => {
    const txTypes = ['transfer', 'stake', 'unstake', 'claim'];
    const statuses = ['confirmed', 'pending', 'failed'];
    const tokens = ['SYN', 'AIP'];
    
    return Array.from({ length: count }, (_, i) => {
      const type = txTypes[Math.floor(Math.random() * txTypes.length)];
      const token = type === 'stake' || type === 'unstake' || type === 'claim' ? 'SYN' : tokens[Math.floor(Math.random() * tokens.length)];
      const timestamp = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString();
      
      return {
        hash: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`,
        type,
        token,
        amount: (Math.random() * 100).toFixed(4),
        from: type === 'claim' ? null : account,
        to: type === 'transfer' ? `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}` : account,
        timestamp,
        status: statuses[Math.floor(Math.random() * statuses.length)],
      };
    });
  };
  
  // Calculate USD values
  const synUsdValue = (Number(synBalance) * tokenPrices.SYN).toFixed(2);
  const aipUsdValue = (Number(aipBalance) * tokenPrices.AIP).toFixed(2);
  const stakedUsdValue = (Number(stakedAmount) * tokenPrices.SYN).toFixed(2);
  const totalUsdValue = (Number(synUsdValue) + Number(aipUsdValue) + Number(stakedUsdValue)).toFixed(2);
  
  // Handle refreshing data
  const handleRefresh = () => {
    fetchBalances();
    fetchTransactions();
  };
  
  // Render wallet connection prompt if not connected
  if (!account) {
    return (
      <div style={{ padding: '2rem' }}>
        <Empty
          description={
            <Space direction="vertical" align="center">
              <Title level={4}>Connect Wallet</Title>
              <Text>Please connect your wallet to view your tokens</Text>
              <Button type="primary" icon={<WalletOutlined />} onClick={connectWallet}>
                Connect Wallet
              </Button>
            </Space>
          }
        />
      </div>
    );
  }
  
  // Render network warning if on invalid network
  if (!isValidNetwork) {
    return (
      <div style={{ padding: '2rem' }}>
        <Alert
          message="Unsupported Network"
          description={`Please switch to a supported network. Current network: ${networkName || 'Unknown'}`}
          type="warning"
          showIcon
        />
      </div>
    );
  }
  
  return (
    <div style={{ padding: '2rem' }}>
      <Spin spinning={loading}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={2}>Your Tokens</Title>
            <Text type="secondary">Total Value: ${totalUsdValue}</Text>
          </div>
          
          <Tabs defaultActiveKey="balance" size="large">
            <TabPane 
              tab={
                <span>
                  <LineChartOutlined />
                  Balance
                </span>
              } 
              key="balance"
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <TokenCard
                    tokenSymbol="SYN"
                    tokenName="Synergy Token"
                    balance={synBalance}
                    stakedAmount={stakedAmount}
                    usdValue={synUsdValue}
                    priceChange={priceChanges.SYN}
                    signer={signer}
                    networkId={networkId}
                    onTransactionComplete={handleRefresh}
                    tokenDescription={tokenDescriptions.SYN}
                    tokenLogo={tokenLogos.SYN}
                  />
                </Col>
                
                <Col xs={24} md={12}>
                  <TokenCard
                    tokenSymbol="AIP"
                    tokenName="AI Power Token"
                    balance={aipBalance}
                    usdValue={aipUsdValue}
                    priceChange={priceChanges.AIP}
                    signer={signer}
                    networkId={networkId}
                    onTransactionComplete={handleRefresh}
                    tokenDescription={tokenDescriptions.AIP}
                    tokenLogo={tokenLogos.AIP}
                  />
                </Col>
              </Row>
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <BankOutlined />
                  Staking
                </span>
              } 
              key="staking"
            >
              <StakingPanel
                synBalance={synBalance}
                stakedAmount={stakedAmount}
                signer={signer}
                networkId={networkId}
                account={account}
                provider={provider}
                onTransactionComplete={handleRefresh}
              />
            </TabPane>
            
            <TabPane 
              tab={
                <span>
                  <HistoryOutlined />
                  History
                </span>
              } 
              key="history"
            >
              <TransactionHistory
                transactions={transactions}
                onRefresh={fetchTransactions}
                loading={transactionLoading}
                networkId={networkId}
                onViewDetails={(tx) => console.log('View transaction details:', tx)}
              />
            </TabPane>
          </Tabs>
        </Space>
      </Spin>
    </div>
  );
};

export default TokensPage; 