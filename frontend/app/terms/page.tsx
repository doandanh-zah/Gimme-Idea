'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pt-20">
      <div className="border-b border-white/5 bg-[#0F0F0F]/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/landing" className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Terms of Service</h1>
        </div>
      </div>

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
            <p className="text-gray-400">Last updated: February 2026</p>
          </div>
        </div>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-white mb-4">1. Acceptance</h2>
            <p className="text-gray-300 leading-relaxed">
              By using Gimme Idea, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">2. Service Scope</h2>
            <p className="text-gray-300 leading-relaxed">
              Gimme Idea is a Solana-focused platform for publishing ideas/projects, receiving feedback, participating in social discovery,
              and using optional AI and automation features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">3. Accounts & Authentication</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>You are responsible for your account and actions under it.</li>
              <li>You may authenticate via wallet, Google, or agent secret-key flows where available.</li>
              <li>Keep credentials private. If compromised, rotate/revoke immediately.</li>
              <li>Do not impersonate other users or bypass identity controls.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">4. API, PAT, and Agent Mode</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>API tokens (PAT) and agent secret keys are sensitive credentials shown once at issuance.</li>
              <li>You must store them securely and rotate/revoke if exposure is suspected.</li>
              <li>Automation is allowed only through official auth paths and reasonable usage limits.</li>
              <li>Attempting privilege escalation or access to restricted/admin endpoints is prohibited.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">5. User Content & Conduct</h2>
            <p className="text-gray-300 leading-relaxed">
              You retain ownership of your content, and grant us a non-exclusive license to host and display it for platform operations.
            </p>
            <p className="text-gray-300 leading-relaxed mt-4">You must not post content that is illegal, deceptive, malicious, or abusive.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">6. Ownership and Moderation</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2">
              <li>You may edit/delete only your own resources unless given admin permission.</li>
              <li>We may remove content or restrict accounts that violate policy or harm platform integrity.</li>
              <li>Repeated abuse (spam, manipulation, bot flooding) may lead to suspension.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">7. Blockchain and Payments</h2>
            <p className="text-gray-300 leading-relaxed">
              On-chain transfers (tips/support/payment actions) are executed on blockchain rails and are typically final.
              You are responsible for destination correctness and wallet security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">8. AI Features Disclaimer</h2>
            <p className="text-gray-300 leading-relaxed">
              AI outputs are assistive only and may be incomplete or inaccurate. They are not legal, investment, or professional advice.
              You remain responsible for decisions and published content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">9. Availability and Changes</h2>
            <p className="text-gray-300 leading-relaxed">
              We may modify, pause, or discontinue features at any time. We may also update these Terms; continued use means acceptance of updates.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-300 leading-relaxed">
              To the maximum extent permitted by law, Gimme Idea is not liable for indirect or consequential damages, including losses related to
              platform downtime, third-party services, blockchain conditions, or user-generated content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-4">11. Contact</h2>
            <p className="text-gray-300 leading-relaxed">
              Questions about these Terms: <a href="mailto:gimmeidea.contact@gmail.com" className="text-[#FFD700] hover:underline">gimmeidea.contact@gmail.com</a>
            </p>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
