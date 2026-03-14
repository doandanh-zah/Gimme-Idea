'use client';

import Link from 'next/link';
import { Download, Smartphone, ShieldCheck, Zap } from 'lucide-react';

export default function MobileLandingPage() {
  return (
    <div className="min-h-screen text-white bg-[#07070B]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="text-xl font-bold">Gimme<span className="text-[#FFD700]">Idea</span></div>
          <div className="flex items-center gap-2">
            <Link href="/landing" className="px-4 py-2 rounded-full text-sm border border-white/20 hover:bg-white/10">Web</Link>
            <Link href="/idea" className="px-4 py-2 rounded-full text-sm bg-[#FFD700] text-black font-semibold">Open App</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="max-w-6xl mx-auto px-4 pt-14 pb-10">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FFD700]/40 bg-[#FFD700]/10 text-[#FFD700] text-xs uppercase tracking-wider">Mobile First Experience</p>
              <h1 className="mt-5 text-4xl md:text-5xl font-bold leading-tight">Gimme Idea for <span className="text-[#FFD700]">Android</span> and soon <span className="text-cyan-300">iOS</span></h1>
              <p className="mt-4 text-gray-300 text-lg">Same Gimme Idea workflow, optimized for phone: discover ideas, vote, comment, and publish faster from anywhere.</p>

              <div className="mt-7 grid sm:grid-cols-2 gap-3">
                <a
                  href="https://t.me/DoanZah"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center gap-2 px-5 py-3 rounded-full bg-[#FFD700] text-black font-semibold hover:opacity-90 transition"
                >
                  <Download size={18} /> Download Android APK
                </a>
                <a
                  href="/contact"
                  className="inline-flex justify-center items-center gap-2 px-5 py-3 rounded-full border border-white/20 hover:bg-white/10 transition"
                >
                  <Smartphone size={18} /> Request iOS TestFlight
                </a>
              </div>

              <p className="mt-3 text-xs text-gray-500">Tip: nếu cần bản APK mới nhất, bấm “Download Android APK” để nhận trực tiếp.</p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="text-lg font-semibold">What you get on mobile</h3>
              <div className="mt-4 space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFD700]/20 text-[#FFD700] flex items-center justify-center"><Zap size={18} /></div>
                  <div>
                    <p className="font-semibold">Fast idea loop</p>
                    <p className="text-sm text-gray-400">Post, vote, and reply in seconds with cleaner mobile UX.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center"><Smartphone size={18} /></div>
                  <div>
                    <p className="font-semibold">Phone-optimized navigation</p>
                    <p className="text-sm text-gray-400">Safer spacing for camera cutout + smoother in-app interactions.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 text-green-300 flex items-center justify-center"><ShieldCheck size={18} /></div>
                  <div>
                    <p className="font-semibold">Secure account flows</p>
                    <p className="text-sm text-gray-400">OAuth/session behavior tuned for app usage and persistence.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-12 text-center">
            <h2 className="text-3xl font-bold">Install now. Build faster.</h2>
            <p className="mt-2 text-gray-400">Gimme Idea mobile is designed for builders shipping in real life, not just desktop sessions.</p>
          </div>
        </section>
      </main>
    </div>
  );
}
