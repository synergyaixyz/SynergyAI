import React from 'react';
import Head from 'next/head';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout = ({ children, title = 'SynergyAI', description = 'Decentralized AI computation and data sovereignty platform' }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <Navbar />
      
      <main className="flex-grow pt-20">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout; 