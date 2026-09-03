'use client';

import { KeyRound, LogOut, Wallet } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { AuthDialog } from '@/components/auth-dialog';
import { WalletDialog } from '@/components/wallet-dialog';
import { useAuth } from '@/lib/auth';
import { formatStableValue } from '@/lib/format-number';

const copy = {
  en: {
    signedIn: 'Signed in',
    signedOut: 'Not signed in',
    signIn: 'Sign in',
    openWallet: 'Open wallet',
    walletPending: 'Wallet provisioning pending',
    logout: 'Log out',
  },
  vi: {
    signedIn: 'Đã đăng nhập',
    signedOut: 'Chưa đăng nhập',
    signIn: 'Đăng nhập',
    openWallet: 'Mở ví',
    walletPending: 'Đang chờ cấp ví',
    logout: 'Đăng xuất',
  },
} as const;

export function ProfileSession({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const auth = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [walletDialogOpen, setWalletDialogOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const actor = auth.session ?? {
    displayName: 'Guest',
    username: 'guest',
    avatarInitials: 'G',
  };
  const balance = formatStableValue(auth.wallet?.balanceUsdc ?? '0', 'compact');

  const logout = async () => {
    setLoggingOut(true);
    try {
      await auth.logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <section className="guest-profile-state profile-session-state">
      <span className="guest-avatar guest-avatar-large">{actor.avatarInitials}</span>
      <div>
        <h2>{actor.displayName}</h2>
        <p>
          @{actor.username} · {auth.isSignedIn ? t.signedIn : t.signedOut}
        </p>
        {auth.isSignedIn && (
          <p>{auth.wallet?.status === 'ready' ? balance.display : t.walletPending}</p>
        )}
        {auth.error && (
          <p className="composer-form-error" role="alert">
            {auth.error}
          </p>
        )}
      </div>
      <div className="profile-session-actions">
        {!auth.isSignedIn ? (
          <button
            type="button"
            className="button button-primary"
            onClick={() => setAuthDialogOpen(true)}
          >
            <KeyRound size={17} aria-hidden="true" />
            {t.signIn}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="button button-primary"
              onClick={() => setWalletDialogOpen(true)}
            >
              <Wallet size={17} aria-hidden="true" />
              {t.openWallet} · <span className="wallet-number">{balance.display}</span>
            </button>
            <button
              type="button"
              className="button button-quiet"
              disabled={loggingOut}
              aria-busy={loggingOut}
              onClick={() => void logout()}
            >
              <LogOut size={17} aria-hidden="true" />
              {t.logout}
            </button>
          </>
        )}
      </div>
      <AuthDialog locale={locale} open={authDialogOpen} onClose={() => setAuthDialogOpen(false)} />
      <WalletDialog
        locale={locale}
        open={walletDialogOpen}
        onClose={() => setWalletDialogOpen(false)}
      />
    </section>
  );
}
