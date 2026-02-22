'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20">
      <div className="border-b border-white/5 bg-[#0F0F0F]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/landing" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Privacy Policy</h1>
        </div>
      </div>

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
            <h2 className="text-xl font-bold text-white mb-4">1. Data We Collect</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li><strong>Account data:</strong> username, email (when used), profile metadata.</li>
              <li><strong>Auth data:</strong> wallet public addresses, auth provider metadata, and login history.</li>
              <li><strong>Automation credentials metadata:</strong> hashed PAT/agent-key records and usage metadata (never plaintext after issuance).</li>
              <li><strong>User content:</strong> ideas, projects, comments, votes, follows, and related interactions.</li>
              <li><strong>Operational logs:</strong> API usage, rate-limit and abuse-prevention events, and security diagnostics.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. How We Use Data</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>To provide platform functionality and account security.</li>
              <li>To process content operations (create/edit/delete) and social features.</li>
              <li>To run AI features and improve quality/safety controls.</li>
              <li>To detect fraud, abuse, and unauthorized access attempts.</li>
              <li>To maintain reliability, monitoring, and incident response.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Sharing and Disclosure</h2>
            <p className="text-gray-300 leading-relaxed">
              We do not sell personal data. We may disclose limited information when required by law, to protect users/platform integrity,
              or to trusted service providers under contractual controls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. Public vs Private Data</h2>
            <p className="text-gray-300 leading-relaxed">
              Content you publish on Gimme Idea is visible according to product behavior (generally public/community-visible).
              Keep sensitive information out of public posts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. Blockchain Notice</h2>
            <p className="text-gray-300 leading-relaxed">
              On-chain actions are publicly observable and generally immutable. We cannot modify blockchain state or reverse finalized on-chain transactions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Security Practices</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Credential secrets are not stored in plaintext after issuance where designed.</li>
              <li>Rate limits, auditing, and abuse controls are used to reduce risk.</li>
              <li>Access is restricted by authorization and ownership checks.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Retention</h2>
            <p className="text-gray-300 leading-relaxed">
              We retain data for product operations, compliance, fraud prevention, and security investigation needs.
              Retention windows may vary by data type and legal obligations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. Your Controls</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>Update profile information in-app.</li>
              <li>Rotate/revoke API tokens or agent keys.</li>
              <li>Request account/content support through official contact channels.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Policy Updates</h2>
            <p className="text-gray-300 leading-relaxed">
              We may revise this policy as product capabilities evolve. Continued use after updates means acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              Privacy and security inquiries: <a href="mailto:gimmeidea.contact@gmail.com" className="text-purple-400 hover:underline">gimmeidea.contact@gmail.com</a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
