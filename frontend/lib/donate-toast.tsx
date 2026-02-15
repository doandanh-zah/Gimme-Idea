'use client';

import toast from 'react-hot-toast';

export function showDonateToast(context: 'support' | 'withdraw') {
  const label = context === 'support' ? 'supporting an idea' : 'withdrawing funds';

  toast.custom(
    (t) => (
      <div
        className={`max-w-sm w-[92vw] sm:w-[380px] rounded-2xl border border-white/10 bg-[#0F0F0F] shadow-2xl p-4 text-white ${
          t.visible ? 'animate-enter' : 'animate-leave'
        }`}
      >
        <div className="text-sm font-bold">Keep Gimme Idea running</div>
        <div className="text-xs text-gray-400 mt-1">
          You just finished {label}. Want to donate a little SOL to help the dev team maintain and improve Gimme Idea?
        </div>
        <div className="mt-3 flex gap-2 justify-end">
          <button
            className="px-3 py-1.5 rounded-full text-xs bg-white/10 hover:bg-white/15 border border-white/10"
            onClick={() => toast.dismiss(t.id)}
          >
            Not now
          </button>
          <button
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
            onClick={() => {
              toast.dismiss(t.id);
              // Use a hard redirect to avoid depending on router context
              window.location.href = '/donate';
            }}
          >
            Donate SOL
          </button>
        </div>
      </div>
    ),
    {
      duration: 12000,
      position: 'bottom-right',
    }
  );
}
