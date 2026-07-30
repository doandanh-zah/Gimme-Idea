import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TermsPage() {
  return (
    <main className="relative min-h-screen pb-20 pt-28 text-gray-300">

      <div className="page-shell">
        <Link
          href="/home"
          className="mb-8 inline-flex min-h-[40px] items-center gap-2 text-sm text-gray-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Landing
        </Link>

        <header className="border-b border-white/10 pb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-[#FFD700]/30 bg-[#FFD700]/10">
              <FileText className="h-6 w-6 text-[#FFD700]" />
            </div>
            <div>
              <p className="ui-eyebrow">Legal</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Terms of Service</h1>
              <p className="mt-2 text-sm text-gray-500">Last updated: February 2026</p>
            </div>
          </div>
        </header>

        <div className="prose prose-invert max-w-none space-y-8 py-10">
          <section>
            <h2 className="mb-4 text-xl font-bold text-white">1. Acceptance</h2>
            <p className="leading-relaxed text-gray-300">
              By using Gimme Idea, you agree to these Terms and our Privacy Policy. If you do not agree, do not use the service.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">2. Service Scope</h2>
            <p className="leading-relaxed text-gray-300">
              Gimme Idea is a Solana-focused platform for publishing ideas/projects, receiving feedback, participating in social discovery,
              and using optional AI and automation features.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">3. Accounts & Authentication</h2>
            <ul className="list-inside list-disc space-y-2 text-gray-300">
              <li>You are responsible for your account and actions under it.</li>
              <li>You may authenticate via wallet, Google, or agent secret-key flows where available.</li>
              <li>Keep credentials private. If compromised, rotate/revoke immediately.</li>
              <li>Do not impersonate other users or bypass identity controls.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">4. API, PAT, and Agent Mode</h2>
            <ul className="list-inside list-disc space-y-2 text-gray-300">
              <li>API tokens (PAT) and agent secret keys are sensitive credentials shown once at issuance.</li>
              <li>You must store them securely and rotate/revoke if exposure is suspected.</li>
              <li>Automation is allowed only through official auth paths and reasonable usage limits.</li>
              <li>Attempting privilege escalation or access to restricted/admin endpoints is prohibited.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">5. User Content & Conduct</h2>
            <p className="leading-relaxed text-gray-300">
              You retain ownership of your content, and grant us a non-exclusive license to host and display it for platform operations.
            </p>
            <p className="mt-4 leading-relaxed text-gray-300">
              You must not post content that is illegal, deceptive, malicious, or abusive.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">6. Ownership and Moderation</h2>
            <ul className="list-inside list-disc space-y-2 text-gray-300">
              <li>You may edit/delete only your own resources unless given admin permission.</li>
              <li>We may remove content or restrict accounts that violate policy or harm platform integrity.</li>
              <li>Repeated abuse (spam, manipulation, bot flooding) may lead to suspension.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">7. Blockchain and Payments</h2>
            <p className="leading-relaxed text-gray-300">
              On-chain transfers (tips/support/payment actions) are executed on blockchain rails and are typically final.
              You are responsible for destination correctness and wallet security.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">8. AI Features Disclaimer</h2>
            <p className="leading-relaxed text-gray-300">
              AI outputs are assistive only and may be incomplete or inaccurate. They are not legal, investment, or professional advice.
              You remain responsible for decisions and published content.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">9. Availability and Changes</h2>
            <p className="leading-relaxed text-gray-300">
              We may modify, pause, or discontinue features at any time. We may also update these Terms; continued use means acceptance of updates.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">10. Limitation of Liability</h2>
            <p className="leading-relaxed text-gray-300">
              To the maximum extent permitted by law, Gimme Idea is not liable for indirect or consequential damages, including losses related to
              platform downtime, third-party services, blockchain conditions, or user-generated content.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">11. Contact</h2>
            <p className="leading-relaxed text-gray-300">
              Questions about these Terms:{' '}
              <a href="mailto:gimmeidea.contact@gmail.com" className="text-[#FFD700] underline-offset-4 hover:underline">
                gimmeidea.contact@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
