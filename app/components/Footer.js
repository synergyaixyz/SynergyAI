import React from 'react';
import { Row, Col, Space, Typography, Button, Divider } from 'antd';
import { GithubOutlined, TwitterOutlined, MediumOutlined, DiscordOutlined } from '@ant-design/icons';

const navigation = [
  {
    title: 'Products',
    items: [
      { name: 'Distributed Computing', href: '/compute' },
      { name: 'Data Vault', href: '/data' },
      { name: 'Token Economy', href: '/tokens' },
      { name: 'App Ecosystem', href: '/ecosystem' }
    ]
  },
  {
    title: 'Resources',
    items: [
      { name: 'Documentation', href: '/docs' },
      { name: 'Whitepaper', href: '/whitepaper' },
      { name: 'Developer Guide', href: '/developers' },
      { name: 'Learning Center', href: '/learn' }
    ]
  },
  {
    title: 'Community',
    items: [
      { name: 'Discord', href: 'https://discord.gg/synergy' },
      { name: 'Twitter', href: 'https://twitter.com/synergyai' },
      { name: 'Github', href: 'https://github.com/synergyai' },
      { name: 'Forum', href: '/forum' }
    ]
  },
  {
    title: 'About',
    items: [
      { name: 'Company', href: '/about' },
      { name: 'Team', href: '/team' },
      { name: 'Join Us', href: '/careers' },
      { name: 'Contact', href: '/contact' }
    ]
  }
];

const { Title, Text, Link } = Typography;

export default function Footer() {
  return (
    <footer className="bg-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <Row gutter={[24, 40]} justify="space-around">
          {navigation.map((section) => (
            <Col key={section.title} xs={12} sm={12} md={6} lg={5} xl={4}>
              <Title level={5}>{section.title}</Title>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {section.items.map((item) => (
                  <li key={item.name} style={{ marginTop: '0.75rem' }}>
                    <a
                      href={item.href}
                      className="text-base text-gray-500 hover:text-gray-900"
                    >
                      {item.name}
                    </a>
                  </li>
                ))}
              </ul>
            </Col>
          ))}

          <Col xs={24} sm={24} md={6} lg={5} xl={4}>
            <Title level={5}>Subscribe to our newsletter</Title>
            <div style={{ marginTop: '0.75rem' }}>
              <Text type="secondary">
                Get the latest news, updates, and special offers sent directly to your inbox.
              </Text>
              <div style={{ marginTop: '1rem', display: 'flex' }}>
                <input
                  type="email"
                  placeholder="Email address"
                  style={{
                    padding: '0.5rem',
                    borderRadius: '0.375rem',
                    borderWidth: '1px',
                    width: '100%',
                    marginRight: '0.5rem'
                  }}
                />
                <Button type="primary">Subscribe</Button>
              </div>
            </div>
          </Col>
        </Row>

        <Divider style={{ margin: '2rem 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ marginBottom: '1rem' }}>
            &copy; {new Date().getFullYear()} SynergyAI Team. All rights reserved.
          </div>
          <Space size="large">
            <a href="https://twitter.com/synergyai" target="_blank" rel="noopener noreferrer">
              <TwitterOutlined style={{ fontSize: '1.5rem' }} />
            </a>
            <a href="https://github.com/synergyai" target="_blank" rel="noopener noreferrer">
              <GithubOutlined style={{ fontSize: '1.5rem' }} />
            </a>
            <a href="https://discord.gg/synergy" target="_blank" rel="noopener noreferrer">
              <DiscordOutlined style={{ fontSize: '1.5rem' }} />
            </a>
            <a href="https://medium.com/synergyai" target="_blank" rel="noopener noreferrer">
              <MediumOutlined style={{ fontSize: '1.5rem' }} />
            </a>
          </Space>
        </div>
      </div>
    </footer>
  );
}
