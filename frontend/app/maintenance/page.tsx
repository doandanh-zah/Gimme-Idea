import { Clock, Mail, Wrench } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <main className="min-h-screen page-top text-gray-300">
      <section className="page-shell flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg border border-white/10 bg-white/[0.03] p-6 text-center sm:p-8">
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-[#FFD700]/30 bg-[#FFD700]/10">
          <Wrench className="h-7 w-7 text-[#FFD700]" />
        </div>

        <p className="ui-eyebrow mx-auto mt-6 w-fit">System status</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Under Maintenance
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-7 text-gray-400">
          We are upgrading Gimme Idea to improve reliability and performance. The product will be back online shortly.
        </p>

        <div className="mt-8 border border-[#FFD700]/20 bg-[#FFD700]/10 p-4">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-yellow-50">
            <Clock className="h-4 w-4 text-[#FFD700]" />
            Estimated time: 1 day
          </div>
          <p className="mt-2 text-sm text-gray-400">Thank you for your patience.</p>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Questions?{' '}
          <a
            href="mailto:gimmeidea.contact@gmail.com"
            className="inline-flex items-center gap-1 text-[#FFD700] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD700]"
          >
            <Mail className="h-3.5 w-3.5" />
            Contact us
          </a>
        </p>
        </div>
      </section>
    </main>
  );
}
