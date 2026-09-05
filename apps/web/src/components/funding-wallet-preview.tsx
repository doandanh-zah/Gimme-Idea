'use client';

import { ArrowRight, Building2, ExternalLink, WalletCards } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import type { BountyModel } from '@/lib/domain/types';
import { FundingStatus, RewardAmount } from '@/components/v1-primitives';

export function FundingWalletPreview({ bounty, locale }: { bounty: BountyModel; locale: Locale }) {
  const [reviewing, setReviewing] = useState(false);
  const total = bounty.amountUsdc + (bounty.platformFeeUsdc ?? 0);
  return (
    <section className="v1-funding-preview">
      <header>
        <div>
          <p className="v1-kicker">ORGANIZATION FUNDING</p>
          <h2>{locale === 'vi' ? 'Fund Build Bounty' : 'Fund Build Bounty'}</h2>
        </div>
        <Building2 size={24} aria-hidden="true" />
      </header>
      <p className="v1-wallet-separation">
        <strong>{locale === 'vi' ? 'Funding Wallet' : 'Funding Wallet'}</strong>
        {locale === 'vi'
          ? ' do Organization kết nối để khóa escrow. Đây không phải Gimme Wallet dùng để nhận reward.'
          : ' is connected by the Organization to fund escrow. It is not the Gimme Wallet used to receive rewards.'}
      </p>
      <dl className="v1-money-breakdown">
        <div>
          <dt>{locale === 'vi' ? 'Giải thưởng' : 'Prize'}</dt>
          <dd>
            <RewardAmount amount={bounty.amountUsdc} locale={locale} />
          </dd>
        </div>
        <div>
          <dt>{locale === 'vi' ? 'Phí platform' : 'Platform fee'}</dt>
          <dd>{bounty.platformFeeUsdc?.toLocaleString(locale) ?? '—'} USDC</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{total.toLocaleString(locale)} USDC</dd>
        </div>
      </dl>
      <FundingStatus state={bounty.funding} amount={bounty.amountUsdc} locale={locale} />
      {reviewing ? (
        <div className="v1-funding-disconnected" role="status">
          <WalletCards size={22} aria-hidden="true" />
          <span>
            <strong>
              {locale === 'vi'
                ? 'Funding Wallet chưa được kết nối'
                : 'Funding Wallet is not connected'}
            </strong>
            <small>
              {locale === 'vi'
                ? 'Luồng ký và fund escrow thuộc Backend Phase 3. Không có giao dịch nào được tạo.'
                : 'Signing and escrow funding belong to Backend Phase 3. No transaction was created.'}
            </small>
          </span>
          <button type="button" className="button button-quiet" onClick={() => setReviewing(false)}>
            {locale === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      ) : (
        <button type="button" className="button button-primary" onClick={() => setReviewing(true)}>
          <WalletCards size={18} aria-hidden="true" />
          {locale === 'vi' ? 'Kết nối Funding Wallet' : 'Connect Funding Wallet'}
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      )}
      <p className="v1-dev-note">
        <ExternalLink size={14} aria-hidden="true" /> Development preview · financial settlement not
        connected
      </p>
    </section>
  );
}
