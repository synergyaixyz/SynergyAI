import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Testimonial from '../components/Testimonial';
import FeatureCard from '../components/FeatureCard';
import StatsCounter from '../components/StatsCounter';
import Partners from '../components/Partners';

export default function Home() {
  // Features data for the landing page
  const features = [
    {
      title: 'Decentralized AI Computing',
      description: 'Distribute AI computing resources through blockchain technology, lowering barriers to entry and democratizing artificial intelligence.',
      icon: '🌐',
    },
    {
      title: 'Data Sovereignty Protection',
      description: 'Ensure complete control over your personal data through encryption technology and smart contracts.',
      icon: '🔐',
    },
    {
      title: 'Token Incentive Mechanism',
      description: 'Earn token rewards by participating in the ecosystem, incentivizing contributions of computing resources and high-quality data.',
      icon: '💰',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Head>
        <title>SynergyAI - Collaborative Innovation in AI and Crypto-Economic Ecosystem</title>
        <meta name="description" content="SynergyAI is dedicated to creating a revolutionary ecosystem that democratizes AI computing resources through decentralized collaboration" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-20">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              SynergyAI
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto">
              A collaborative innovative AI and crypto-economic ecosystem where everyone can equally participate in and benefit from the artificial intelligence revolution
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/dashboard">
                <span className="bg-white text-indigo-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-medium text-lg cursor-pointer">
                  Enter App
                </span>
              </Link>
              <Link href="/about">
                <span className="bg-transparent border-2 border-white hover:bg-white/10 px-6 py-3 rounded-lg font-medium text-lg cursor-pointer">
                  Learn More
                </span>
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <FeatureCard key={index} {...feature} />
              ))}
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <StatsCounter number={10000} label="Active Users" suffix="+" />
              <StatsCounter number={5000} label="GPU Nodes" suffix="+" />
              <StatsCounter number={1000000} label="Compute Hours" suffix="+" />
              <StatsCounter number={50} label="AI Models" suffix="+" />
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">User Feedback</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Testimonial
                quote="SynergyAI has allowed me to train my AI models at an extremely low cost, which was unimaginable in the past."
                author="Zhang Wen / AI Researcher"
                image="/testimonials/user1.jpg"
              />
              <Testimonial
                quote="As a computing resource provider, my idle GPUs now generate passive income while supporting innovative projects."
                author="Li Ming / Hardware Engineer"
                image="/testimonials/user2.jpg"
              />
              <Testimonial
                quote="The data sovereignty features allow me to confidently share training data while maintaining control over my data."
                author="Wang Li / Data Scientist"
                image="/testimonials/user3.jpg"
              />
            </div>
          </div>
        </section>

        {/* Partners */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-center mb-8">Partners</h2>
            <Partners />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-indigo-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6">Join the SynergyAI Ecosystem</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Whether you're an AI developer, computing resource provider, or data owner, you'll find value and opportunity on our platform
            </p>
            <Link href="/register">
              <span className="bg-white text-indigo-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-medium text-lg inline-block cursor-pointer">
                Register Now
              </span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
