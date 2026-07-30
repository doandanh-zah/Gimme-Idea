import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <main className="relative min-h-screen pb-20 pt-28 text-gray-300">

      <div className="page-shell">
        <Link
          href="/landing"
          className="mb-8 inline-flex min-h-[40px] items-center gap-2 text-sm text-gray-400 transition hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Landing
        </Link>

        <header className="border-b border-white/10 pb-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center border border-[#FFD700]/30 bg-[#FFD700]/10">
              <Shield className="h-6 w-6 text-[#FFD700]" />
            </div>
            <div>
              <p className="ui-eyebrow">Policy</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Privacy Policy</h1>
              <p className="mt-2 text-sm text-gray-500">Last updated: February 2026</p>
            </div>
          </div>
        </header>

        <div className="prose prose-invert max-w-none space-y-8 py-10">
          <section>
            <h2 className="mb-4 text-xl font-bold text-white">1. Data We Collect</h2>
            <ul className="list-inside list-disc space-y-2 text-gray-300">
              <li><strong>Account data:</strong> username, email (when used), profile metadata.</li>
              <li><strong>Auth data:</strong> wallet public addresses, auth provider metadata, and login history.</li>
              <li><strong>Automation credentials metadata:</strong> hashed PAT/agent-key records and usage metadata (never plaintext after issuance).</li>
              <li><strong>User content:</strong> ideas, projects, comments, votes, follows, and related interactions.</li>
              <li><strong>Operational logs:</strong> API usage, rate-limit and abuse-prevention events, and security diagnostics.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">2. How We Use Data</h2>
            <ul className="list-inside list-disc space-y-2 text-gray-300">
              <li>To provide platform functionality and account security.</li>
              <li>To process content operations (create/edit/delete) and social features.</li>
              <li>To run AI features and improve quality/safety controls.</li>
              <li>To detect fraud, abuse, and unauthorized access attempts.</li>
              <li>To maintain reliability, monitoring, and incident response.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">3. Sharing and Disclosure</h2>
            <p className="leading-relaxed text-gray-300">
              We do not sell personal data. We may disclose limited information when required by law, to protect users/platform integrity,
              or to trusted service providers under contractual controls.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">4. Public vs Private Data</h2>
            <p className="leading-relaxed text-gray-300">
              Content you publish on Gimme Idea is visible according to product behavior (generally public/community-visible).
              Keep sensitive information out of public posts.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">5. Blockchain Notice</h2>
            <p className="leading-relaxed text-gray-300">
              On-chain actions are publicly observable and generally immutable. We cannot modify blockchain state or reverse finalized on-chain transactions.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">6. Security Practices</h2>
            <ul className="list-inside list-disc space-y-2 text-gray-300">
              <li>Credential secrets are not stored in plaintext after issuance where designed.</li>
              <li>Rate limits, auditing, and abuse controls are used to reduce risk.</li>
              <li>Access is restricted by authorization and ownership checks.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">7. Retention</h2>
            <p className="leading-relaxed text-gray-300">
              We retain data for product operations, compliance, fraud prevention, and security investigation needs.
              Retention windows may vary by data type and legal obligations.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">8. Your Controls</h2>
            <ul className="list-inside list-disc space-y-2 text-gray-300">
              <li>Update profile information in-app.</li>
              <li>Rotate/revoke API tokens or agent keys.</li>
              <li>Request account/content support through official contact channels.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">9. Policy Updates</h2>
            <p className="leading-relaxed text-gray-300">
              We may revise this policy as product capabilities evolve. Continued use after updates means acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-bold text-white">10. Contact</h2>
            <p className="leading-relaxed text-gray-300">
              Privacy and security inquiries:{' '}
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
