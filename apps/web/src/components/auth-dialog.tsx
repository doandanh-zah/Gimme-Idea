'use client';

import { FlaskConical, LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { type SocialAuthProvider, useAuth } from '@/lib/auth';

const copy = {
  en: {
    brand: 'Gimme Idea',
    title: 'Sign in.',
    subtitle: 'Sign in with social. Your Gimme Idea wallet is created automatically.',
    continueWith: 'Continue with',
    close: 'Close',
    terms: 'By continuing, you agree to the Terms and Privacy Policy.',
    google: 'Google',
    x: 'X',
    facebook: 'Facebook',
    or: 'or',
    devnet: 'Devnet',
    mock: 'Use test account',
    mockHint: 'A development account with a real Solana Devnet receiving address.',
  },
  vi: {
    brand: 'Gimme Idea',
    title: 'Đăng nhập.',
    subtitle: 'Đăng nhập bằng social. Gimme Idea sẽ tự động tạo ví cho bạn.',
    continueWith: 'Tiếp tục với',
    close: 'Đóng',
    terms: 'Khi tiếp tục, bạn đồng ý với Điều khoản và Chính sách bảo mật.',
    google: 'Google',
    x: 'X',
    facebook: 'Facebook',
    or: 'hoặc',
    devnet: 'Test Devnet',
    mock: 'Dùng tài khoản test',
    mockHint: 'Tài khoản phát triển có địa chỉ nhận tiền Solana Devnet thật.',
  },
} as const;

const socialProviders: Array<{
  id: SocialAuthProvider;
  brand: string;
  className: string;
}> = [
  { id: 'google', brand: 'G', className: 'is-google' },
  { id: 'x', brand: '𝕏', className: 'is-x' },
  { id: 'facebook', brand: 'f', className: 'is-facebook' },
];

export function AuthDialog({
  locale,
  open,
  onClose,
}: {
  locale: Locale;
  open: boolean;
  onClose: () => void;
}) {
  const t = copy[locale];
  const auth = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const closeDialog = () => {
    auth.clearError();
    onClose();
  };

  const run = async (provider: SocialAuthProvider) => {
    setBusyAction(provider);
    auth.clearError();
    try {
      await auth.signInSocial(provider);
      closeDialog();
    } catch {
      // The shared auth state renders a normalized, recoverable error inline.
    } finally {
      setBusyAction(null);
    }
  };

  const runMock = async () => {
    setBusyAction('mock');
    auth.clearError();
    try {
      await auth.signInMock();
      closeDialog();
    } catch {
      // The shared auth state renders a normalized, recoverable error inline.
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      aria-labelledby="auth-dialog-title"
      onClose={closeDialog}
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
    >
      <div className="auth-dialog-shell">
        <button
          type="button"
          className="auth-dialog-close"
          aria-label={t.close}
          onClick={closeDialog}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <header className="auth-intro">
          <p>{t.brand}</p>
          <h2 id="auth-dialog-title">{t.title}</h2>
          <span>{t.subtitle}</span>
        </header>

        <div className="auth-primary-list">
          {socialProviders.map((provider) => (
            <button
              key={provider.id}
              type="button"
              className="auth-pill-button"
              disabled={Boolean(busyAction) || !auth.socialReady}
              aria-busy={busyAction === provider.id}
              onClick={() => void run(provider.id)}
            >
              <span className={`auth-brand-mark ${provider.className}`} aria-hidden="true">
                {provider.brand}
              </span>
              <strong>
                {t.continueWith} {t[provider.id]}
              </strong>
              {busyAction === provider.id && (
                <LoaderCircle className="composer-spinner" size={18} aria-hidden="true" />
              )}
            </button>
          ))}
        </div>

        {auth.devAuthEnabled && (
          <>
            <div className="auth-divider" aria-hidden="true">
              <span>{t.or}</span>
            </div>

            <button
              type="button"
              className="auth-dev-button"
              disabled={Boolean(busyAction)}
              aria-busy={busyAction === 'mock'}
              onClick={() => void runMock()}
            >
              <FlaskConical size={22} aria-hidden="true" />
              <span>
                <strong>{t.mock}</strong>
                <small>{t.mockHint}</small>
              </span>
              <em>{t.devnet}</em>
              {busyAction === 'mock' && (
                <LoaderCircle className="composer-spinner" size={18} aria-hidden="true" />
              )}
            </button>
          </>
        )}

        {auth.error && (
          <p className="auth-inline-error" role="alert">
            {auth.error}
          </p>
        )}

        <p className="auth-terms">{t.terms}</p>
      </div>
    </dialog>
  );
}
