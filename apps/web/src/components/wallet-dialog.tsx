'use client';

import {
  ArrowDownLeft,
  ArrowUpRight,
  Copy,
  ExternalLink,
  History,
  RefreshCw,
  ShieldCheck,
  WalletCards,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { formatWalletAddress, useAuth } from '@/lib/auth';
import {
  devnetExplorerAddressUrl,
  fetchDevnetBalances,
  type DevnetBalances,
} from '@/lib/devnet-wallet';
import { formatSolAmount, formatStableValue, formatUsdcAmount } from '@/lib/format-number';
import { trackFrontendEvent } from '@/lib/domain/analytics';

const copy = {
  en: {
    wallet: 'Rewards',
    description: 'Verified rewards arrive in your automatically provisioned Gimme Wallet.',
    learnMore: 'View this wallet',
    learnMoreSuffix: 'on Solana Explorer.',
    pending: 'Your embedded receiving wallet is still being provisioned.',
    devnet: 'Devnet',
    realWallet: 'Gimme Wallet · on-chain Devnet balance',
    copyAddress: 'Copy wallet address',
    copied: 'Copied',
    viewExplorer: 'View on Solana Explorer',
    refresh: 'Refresh on-chain balances',
    retry: 'Retry',
    loading: 'Reading Devnet balances…',
    loadError: 'Could not read balances from Solana Devnet.',
    balance: 'Balance',
    withdraw: 'Withdraw',
    withdrawUnavailable: 'Withdrawal signing is not connected in this frontend phase.',
    assets: 'Assets',
    feeReserve: 'Network fee reserve',
    activity: 'Activity',
    credited: 'Credited',
    withdrawn: 'Withdrawn',
    security: 'Two-factor authentication will be available with production sign-in',
    viewMore: 'View more',
    help: 'Need help? Inspect every Devnet transaction on Solana Explorer.',
    noActivity: 'Activity indexing is not connected yet',
    noActivityHint: 'Use Solana Explorer to inspect this Devnet vault now.',
    close: 'Close wallet',
    usdcValue: 'USDC balance',
  },
  vi: {
    wallet: 'Phần thưởng',
    description: 'Reward đã xác minh sẽ vào Gimme Wallet được tạo tự động cho bạn.',
    learnMore: 'Xem ví này',
    learnMoreSuffix: 'trên Solana Explorer.',
    pending: 'Ví nhận tiền embedded của bạn đang được tạo.',
    devnet: 'Devnet',
    realWallet: 'Gimme Wallet · số dư on-chain Devnet',
    copyAddress: 'Sao chép địa chỉ ví',
    copied: 'Đã sao chép',
    viewExplorer: 'Xem trên Solana Explorer',
    refresh: 'Làm mới số dư on-chain',
    retry: 'Thử lại',
    loading: 'Đang đọc số dư Devnet…',
    loadError: 'Không thể đọc số dư từ Solana Devnet.',
    balance: 'Số dư',
    withdraw: 'Rút tiền',
    withdrawUnavailable: 'Luồng ký rút tiền chưa được kết nối trong frontend phase này.',
    assets: 'Tài sản',
    feeReserve: 'Dự trữ phí mạng',
    activity: 'Lịch sử',
    credited: 'Đã nhận',
    withdrawn: 'Đã rút',
    security: 'Xác thực hai lớp sẽ có khi đăng nhập production được kích hoạt',
    viewMore: 'Xem thêm',
    help: 'Cần hỗ trợ? Kiểm tra mọi giao dịch Devnet trên Solana Explorer.',
    noActivity: 'Chưa kết nối hệ thống lập chỉ mục giao dịch',
    noActivityHint: 'Hiện tại bạn có thể xem vault Devnet trên Solana Explorer.',
    close: 'Đóng ví',
    usdcValue: 'Số dư USDC',
  },
} as const;

export function WalletDialog({
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
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState<DevnetBalances | null>(null);
  const [balanceState, setBalanceState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdrawReview, setWithdrawReview] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDestination, setWithdrawDestination] = useState('');
  const wallet = auth.wallet;
  const syncWalletUsdcBalance = auth.syncWalletUsdcBalance;
  const usdcValue = balances?.usdc ?? wallet?.balanceUsdc ?? null;
  const tokenBalance = formatUsdcAmount(usdcValue, 'detailed');
  const fiatBalance = formatStableValue(usdcValue, 'detailed');
  const solBalance = formatSolAmount(balances?.sol ?? null, 'detailed');
  const isBalanceLoading =
    wallet?.status === 'ready' && (balanceState === 'idle' || balanceState === 'loading');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open || !wallet?.address || wallet.status !== 'ready') {
      return;
    }
    const controller = new AbortController();
    void fetchDevnetBalances(wallet.address, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return;
        setBalances(next);
        setBalanceState('ready');
        syncWalletUsdcBalance(next.usdc);
      })
      .catch((caught: unknown) => {
        if (
          controller.signal.aborted ||
          (caught instanceof DOMException && caught.name === 'AbortError')
        ) {
          return;
        }
        setBalanceState('error');
      });
    return () => controller.abort();
  }, [open, syncWalletUsdcBalance, wallet?.address, wallet?.status]);

  const refreshBalances = async () => {
    if (!wallet?.address || wallet.status !== 'ready') return;
    setBalanceState('loading');
    try {
      const next = await fetchDevnetBalances(wallet.address);
      setBalances(next);
      setBalanceState('ready');
      syncWalletUsdcBalance(next.usdc);
    } catch {
      setBalanceState('error');
    }
  };

  const closeDialog = () => {
    setCopied(false);
    setWithdrawOpen(false);
    setWithdrawReview(false);
    onClose();
  };

  const copyAddress = async () => {
    if (!wallet?.address) return;
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <dialog
      ref={dialogRef}
      className="wallet-dialog"
      aria-labelledby="wallet-dialog-title"
      onClose={closeDialog}
      onCancel={(event) => {
        event.preventDefault();
        closeDialog();
      }}
    >
      <div className="wallet-dialog-shell">
        <header className="wallet-dialog-header">
          <div className="wallet-title-row">
            <h2 id="wallet-dialog-title">{t.wallet}</h2>
            {wallet?.status === 'ready' && wallet.address && (
              <button
                className="wallet-address-button"
                type="button"
                onClick={() => void copyAddress()}
                aria-label={t.copyAddress}
              >
                <span>{formatWalletAddress(wallet.address)}</span>
                <Copy size={15} aria-hidden="true" />
                <small aria-live="polite">{copied ? t.copied : ''}</small>
              </button>
            )}
            <span className="wallet-network-badge">{t.devnet}</span>
          </div>
          <button
            className="wallet-dialog-close"
            type="button"
            aria-label={t.close}
            onClick={closeDialog}
          >
            <X size={20} aria-hidden="true" />
          </button>
          <p>
            {t.description}{' '}
            {wallet?.address ? (
              <>
                <a href={devnetExplorerAddressUrl(wallet.address)} target="_blank" rel="noreferrer">
                  {t.learnMore}
                  <ExternalLink size={14} aria-hidden="true" />
                </a>{' '}
                {t.learnMoreSuffix}
              </>
            ) : (
              t.pending
            )}
          </p>
        </header>

        <section className="wallet-summary" aria-labelledby="wallet-balance-heading">
          <div className="wallet-balance-block">
            <strong
              className={`wallet-number${isBalanceLoading ? ' is-loading' : ''}`}
              aria-label={fiatBalance.ariaLabel}
              title={fiatBalance.raw}
            >
              {isBalanceLoading && !balances ? '—' : fiatBalance.display}
            </strong>
            <small>USD</small>
            <span id="wallet-balance-heading">{t.balance}</span>
          </div>
          <button
            type="button"
            className="wallet-withdraw-button"
            aria-describedby="wallet-withdraw-note"
            title={t.withdrawUnavailable}
            onClick={() => {
              setWithdrawOpen((value) => !value);
              setWithdrawReview(false);
              trackFrontendEvent({ name: 'withdraw_start', origin: 'local_dev' });
            }}
          >
            {t.withdraw}
            <ArrowUpRight size={18} aria-hidden="true" />
          </button>
          <p className="wallet-security-note" title={t.withdrawUnavailable}>
            <ShieldCheck size={16} aria-hidden="true" />
            {t.security}
          </p>
          <p id="wallet-withdraw-note" className="wallet-withdraw-note">
            {t.withdrawUnavailable}
          </p>
          {wallet?.status === 'ready' && (
            <div className="wallet-sync-row" aria-live="polite">
              {balanceState === 'error' ? (
                <span role="alert">{t.loadError}</span>
              ) : (
                <span>{isBalanceLoading ? t.loading : t.realWallet}</span>
              )}
              <button
                type="button"
                onClick={() => void refreshBalances()}
                disabled={isBalanceLoading}
                aria-label={balanceState === 'error' ? t.retry : t.refresh}
              >
                <RefreshCw
                  className={isBalanceLoading ? 'composer-spinner' : undefined}
                  size={15}
                  aria-hidden="true"
                />
                {balanceState === 'error' ? t.retry : t.refresh}
              </button>
            </div>
          )}
        </section>

        {withdrawOpen && (
          <section className="v1-withdraw-panel" aria-labelledby="withdraw-heading">
            <header>
              <WalletCards size={20} aria-hidden="true" />
              <div>
                <p className="v1-kicker">GIMME WALLET / DEVNET</p>
                <h3 id="withdraw-heading">{t.withdraw}</h3>
              </div>
            </header>
            {!withdrawReview ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (withdrawAmount.trim() && withdrawDestination.trim()) setWithdrawReview(true);
                }}
              >
                <label htmlFor="withdraw-amount">{locale === 'vi' ? 'Số lượng' : 'Amount'} *</label>
                <div className="v1-amount-field">
                  <input
                    id="withdraw-amount"
                    type="text"
                    inputMode="decimal"
                    value={withdrawAmount}
                    onChange={(event) => setWithdrawAmount(event.target.value)}
                    placeholder="0.00"
                    autoComplete="off"
                  />
                  <span>USDC</span>
                </div>
                <label htmlFor="withdraw-destination">
                  {locale === 'vi' ? 'Địa chỉ Solana nhận' : 'Destination Solana address'} *
                </label>
                <input
                  id="withdraw-destination"
                  type="text"
                  value={withdrawDestination}
                  onChange={(event) => setWithdrawDestination(event.target.value)}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="7xKX…p2aB"
                />
                <button className="button button-primary" type="submit">
                  {locale === 'vi' ? 'Kiểm tra lệnh rút' : 'Review Withdrawal'}
                </button>
              </form>
            ) : (
              <div className="v1-withdraw-review">
                <dl>
                  <div>
                    <dt>{locale === 'vi' ? 'Số lượng' : 'Amount'}</dt>
                    <dd>{withdrawAmount} USDC</dd>
                  </div>
                  <div>
                    <dt>{locale === 'vi' ? 'Đích đến' : 'Destination'}</dt>
                    <dd>{withdrawDestination}</dd>
                  </div>
                  <div>
                    <dt>Network</dt>
                    <dd>Solana Devnet</dd>
                  </div>
                  <div>
                    <dt>{locale === 'vi' ? 'Phí ước tính' : 'Estimated fee'}</dt>
                    <dd>{locale === 'vi' ? 'Chưa có' : 'Unavailable'}</dd>
                  </div>
                </dl>
                <p role="status">
                  {locale === 'vi'
                    ? 'Withdrawal chưa được kết nối. Không có giao dịch nào được ký hoặc gửi.'
                    : 'Withdrawal is not connected. No transaction can be signed or submitted.'}
                </p>
                <div>
                  <button
                    type="button"
                    className="button button-quiet"
                    onClick={() => setWithdrawReview(false)}
                  >
                    {locale === 'vi' ? 'Sửa' : 'Edit'}
                  </button>
                  <button type="button" className="button button-primary" disabled>
                    {locale === 'vi' ? 'Xác nhận chưa khả dụng' : 'Confirmation unavailable'}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        <section className="wallet-section" aria-labelledby="wallet-assets-heading">
          <h3 id="wallet-assets-heading">{t.assets}</h3>
          <div className="wallet-asset-row">
            <span className="usdc-mark" aria-hidden="true">
              $
            </span>
            <span>
              <strong>USDC</strong>
              <small>USDC</small>
            </span>
            <span className="wallet-asset-value">
              <strong
                className="wallet-number"
                aria-label={tokenBalance.ariaLabel}
                title={tokenBalance.raw}
              >
                {isBalanceLoading && !balances ? '—' : `${tokenBalance.display} USDC`}
              </strong>
              <small>{isBalanceLoading && !balances ? '—' : fiatBalance.display}</small>
            </span>
          </div>
          <div className="wallet-asset-row">
            <span className="sol-mark" aria-hidden="true">
              ◎
            </span>
            <span>
              <strong>SOL</strong>
              <small>{t.feeReserve}</small>
            </span>
            <span className="wallet-asset-value">
              <strong
                className="wallet-number"
                aria-label={solBalance.ariaLabel}
                title={solBalance.raw}
              >
                {isBalanceLoading && !balances ? '—' : `${solBalance.display} SOL`}
              </strong>
              <small>{t.devnet}</small>
            </span>
          </div>
        </section>

        <section className="wallet-section" aria-labelledby="wallet-activity-heading">
          <h3 id="wallet-activity-heading">{t.activity}</h3>
          {wallet?.activities.length ? (
            <ul className="wallet-activity-list">
              {wallet.activities.slice(0, 3).map((activity) => {
                const signedAmount =
                  activity.type === 'withdrawal'
                    ? `-${activity.amountUsdc.replace(/^-/, '')}`
                    : activity.amountUsdc;
                const amount = formatUsdcAmount(signedAmount, 'detailed', 'always');
                const fiatAmount = formatStableValue(signedAmount, 'detailed', 'always');
                return (
                  <li key={activity.id}>
                    <span className="wallet-activity-coin" aria-hidden="true">
                      <span className="usdc-mark">$</span>
                      <i className={`is-${activity.type}`}>
                        {activity.type === 'credit' ? (
                          <ArrowDownLeft size={14} />
                        ) : (
                          <ArrowUpRight size={14} />
                        )}
                      </i>
                    </span>
                    <span>
                      <strong>{activity.type === 'credit' ? t.credited : t.withdrawn}</strong>
                      <small>
                        USDC ·{' '}
                        {new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
                          dateStyle: 'medium',
                        }).format(new Date(activity.occurredAt))}
                      </small>
                    </span>
                    <span className="wallet-activity-value">
                      <strong
                        className={`wallet-number is-${activity.type}`}
                        aria-label={amount.ariaLabel}
                        title={amount.raw}
                      >
                        {amount.display} USDC
                      </strong>
                      <small>{fiatAmount.display}</small>
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="wallet-empty-state">
              <History size={28} aria-hidden="true" />
              <strong>{t.noActivity}</strong>
              <p>{t.noActivityHint}</p>
              {wallet?.address && (
                <a href={devnetExplorerAddressUrl(wallet.address)} target="_blank" rel="noreferrer">
                  {t.viewExplorer}
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              )}
            </div>
          )}
          {wallet?.activities.length && wallet.address ? (
            <a
              className="wallet-view-more"
              href={devnetExplorerAddressUrl(wallet.address)}
              target="_blank"
              rel="noreferrer"
            >
              {t.viewMore}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ) : null}
          {wallet?.address && (
            <p className="wallet-help">
              {t.help}{' '}
              <a href={devnetExplorerAddressUrl(wallet.address)} target="_blank" rel="noreferrer">
                {t.viewExplorer}
              </a>
            </p>
          )}
        </section>
      </div>
    </dialog>
  );
}
