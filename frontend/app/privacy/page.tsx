'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0F0F0F]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/landing" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-6 py-12"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <p className="text-gray-400">Last updated: February 2026</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p className="text-gray-300 leading-relaxed">
              When you use Gimme Idea, we collect the following information:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li><strong>Account Information:</strong> Email address (via Google Sign-In), username, and profile picture</li>
              <li><strong>Wallet Information:</strong> Your Solana wallet public address (if you choose to connect)</li>
              <li><strong>Content:</strong> Ideas, projects, comments, and feedback you submit</li>
              <li><strong>API Tokens (optional):</strong> If you create Personal Access Tokens (PAT), we store a hashed version of the token and metadata (name, scopes, expiry, last-used time). We do not store the plaintext token after creation.</li>
              <li><strong>Usage Data:</strong> How you interact with our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>To provide and maintain our service</li>
              <li>To enable you to receive tips from other users</li>
              <li>To display your profile and content to other users</li>
              <li>To send you notifications about activity on your content</li>
              <li>To improve our platform and user experience</li>
              <li>To authenticate API requests when you use API Tokens / PAT (and to help prevent fraud/abuse)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Information Sharing</h2>
            <p className="text-gray-300 leading-relaxed">
              We do not sell your personal information. We may share your information only in the following cases:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and prevent fraud</li>
              <li>Public content you post is visible to all users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Blockchain Transactions</h2>
            <p className="text-gray-300 leading-relaxed">
              When you send or receive tips, these transactions are recorded on the Solana blockchain. 
              Blockchain transactions are public and permanent. We cannot delete or modify blockchain data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Data Security</h2>
            <p className="text-gray-300 leading-relaxed">
              We implement appropriate security measures to protect your information. However, no method 
              of transmission over the Internet is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>Access your personal data</li>
              <li>Update or correct your information</li>
              <li>Delete your account</li>
              <li>Disconnect your wallet at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:gimmeidea.contact@gmail.com" className="text-purple-400 hover:underline">
                gimmeidea.contact@gmail.com
              </a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
