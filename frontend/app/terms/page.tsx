'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20">
      {/* Header */}
      <div className="border-b border-white/5 bg-[#0F0F0F]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/landing" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
      </div>

      {/* Content */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-6 py-12"
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 bg-[#FFD700]/20 rounded-full flex items-center justify-center">
            <FileText className="w-8 h-8 text-[#FFD700]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Terms of Service</h1>
            <p className="text-gray-400">Last updated: December 2025</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing or using Gimme Idea, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 leading-relaxed">
              Gimme Idea is a platform where users can share startup ideas, receive feedback from 
              the community, and optionally receive cryptocurrency tips for their contributions. 
              We provide tools for idea sharing, commenting, and peer-to-peer tipping via the Solana blockchain.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. User Accounts</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>You must provide accurate information when creating an account</li>
              <li>You are responsible for maintaining the security of your account</li>
              <li>You must be at least 18 years old to use this service</li>
              <li>One person may not maintain more than one account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. User Content</h2>
            <p className="text-gray-300 leading-relaxed">
              You retain ownership of content you submit. By posting content, you grant us a 
              non-exclusive license to display and distribute your content on our platform.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">
              You agree not to post content that:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-2">
              <li>Is illegal, harmful, or offensive</li>
              <li>Infringes on intellectual property rights</li>
              <li>Contains spam or malicious content</li>
              <li>Impersonates others or is misleading</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Cryptocurrency & Tips</h2>
            <p className="text-gray-300 leading-relaxed">
              Tips are voluntary peer-to-peer transactions on the Solana blockchain. We do not:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 mt-4">
              <li>Hold or custody your cryptocurrency</li>
              <li>Guarantee any tips or payments</li>
              <li>Take responsibility for blockchain transaction failures</li>
              <li>Provide refunds for tips sent to wrong addresses</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-4">
              All blockchain transactions are final and irreversible.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Prohibited Activities</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Attempting to hack or exploit the platform</li>
              <li>Using bots or automated tools without permission</li>
              <li>Manipulating votes or engagement metrics</li>
              <li>Harassing other users</li>
              <li>Using the platform for money laundering or illegal activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Disclaimer</h2>
            <p className="text-gray-300 leading-relaxed">
              Gimme Idea is provided "as is" without warranties of any kind. We do not guarantee 
              that the service will be uninterrupted or error-free. We are not responsible for 
              any investment decisions made based on ideas shared on this platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, Gimme Idea shall not be liable for any 
              indirect, incidental, special, or consequential damages arising from your use of 
              the platform, including but not limited to loss of cryptocurrency.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Changes to Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update these terms from time to time. Continued use of the platform after 
              changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:gimmeidea.contact@gmail.com" className="text-[#FFD700] hover:underline">
                gimmeidea.contact@gmail.com
              </a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
