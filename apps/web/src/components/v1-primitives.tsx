import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import type { Locale } from '@gimme-idea/contracts';
import type {
  DataOrigin,
  FundingState,
  IdeaReferenceModel,
  ProblemReferenceModel,
  Visibility,
} from '@/lib/domain/types';

const originLabels: Record<DataOrigin, { en: string; vi: string }> = {
  api: { en: 'API / canonical', vi: 'API / canonical' },
  database_fixture: { en: 'Database fixture', vi: 'Dữ liệu mẫu database' },
  local_dev: { en: 'Development preview', vi: 'Bản xem trước development' },
  imported_public: { en: 'Imported public source', vi: 'Nguồn công khai đã nhập' },
  ai_preview: { en: 'Research preview', vi: 'Bản xem trước nghiên cứu' },
  onchain_devnet: { en: 'On-chain Devnet', vi: 'On-chain Devnet' },
  mock: { en: 'Mock state', vi: 'Trạng thái mock' },
};

export function DataOriginBadge({ origin, locale }: { origin: DataOrigin; locale: Locale }) {
  return <span className="v1-origin-badge">{originLabels[origin][locale]}</span>;
}

const visibilityLabels: Record<Visibility, { en: string; vi: string }> = {
  public: { en: 'Public', vi: 'Công khai' },
  restricted_summary: { en: 'Restricted summary', vi: 'Tóm tắt giới hạn' },
  restricted_full: { en: 'Restricted', vi: 'Giới hạn' },
  private_owner: { en: 'Private · owner', vi: 'Riêng tư · chủ sở hữu' },
  private_judge: { en: 'Private · review', vi: 'Riêng tư · đánh giá' },
};

export function VisibilityBadge({
  visibility,
  locale,
}: {
  visibility: Visibility;
  locale: Locale;
}) {
  const Icon = visibility === 'public' ? ShieldCheck : LockKeyhole;
  return (
    <span className={`v1-visibility-badge is-${visibility}`}>
      <Icon size={13} aria-hidden="true" />
      {visibilityLabels[visibility][locale]}
    </span>
  );
}

export function PrivateNotice({ locale, judge = false }: { locale: Locale; judge?: boolean }) {
  return (
    <aside className="v1-private-notice">
      <LockKeyhole size={20} aria-hidden="true" />
      <div>
        <strong>{locale === 'vi' ? 'Nội dung riêng tư' : 'Private content'}</strong>
        <p>
          {judge
            ? locale === 'vi'
              ? 'Chỉ chủ sở hữu và người đánh giá được ủy quyền có thể xem.'
              : 'Only the owner and authorized reviewers can view this.'
            : locale === 'vi'
              ? 'Không xuất hiện trên Home, Search, quote hoặc bản xem trước chia sẻ.'
              : 'Excluded from Home, Search, quotes and public share previews.'}
        </p>
      </div>
    </aside>
  );
}

export function RestrictedGate({
  locale,
  title,
  body,
  action,
}: {
  locale: Locale;
  title?: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className="v1-restricted-gate">
      <EyeOff size={28} aria-hidden="true" />
      <p className="v1-kicker">{locale === 'vi' ? 'QUYỀN TRUY CẬP' : 'ACCESS'}</p>
      <h1>
        {title ?? (locale === 'vi' ? 'Nội dung này bị giới hạn' : 'This content is restricted')}
      </h1>
      <p>
        {body ??
          (locale === 'vi'
            ? 'Bạn không có quyền xem nội dung, tệp đính kèm hoặc danh tính người gửi.'
            : 'You do not have permission to view its content, attachments or submitter identity.')}
      </p>
      {action && <div className="v1-gate-actions">{action}</div>}
    </section>
  );
}

export function RewardAmount({ amount, locale }: { amount: number; locale: Locale }) {
  return (
    <strong className="v1-reward" aria-label={`${amount} USDC`}>
      {new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
        maximumFractionDigits: 0,
      }).format(amount)}{' '}
      <span>USDC</span>
    </strong>
  );
}

export function FundingStatus({
  state,
  amount,
  locale,
  explorerUrl,
}: {
  state: FundingState;
  amount: number;
  locale: Locale;
  explorerUrl?: string;
}) {
  const verified = state === 'devnet_verified' || state === 'mainnet_verified';
  const labels = {
    not_connected: locale === 'vi' ? 'Chưa kết nối funding' : 'Funding not connected',
    development_unverified:
      locale === 'vi'
        ? 'Development · chưa xác minh funding'
        : 'Development · funding not verified',
    devnet_verified: locale === 'vi' ? 'Devnet đã xác minh' : 'Devnet verified',
    mainnet_verified: locale === 'vi' ? 'Đã khóa trong escrow' : 'Locked in escrow',
  };
  return (
    <div className={`v1-funding-status${verified ? ' is-verified' : ''}`}>
      {verified ? (
        <CheckCircle2 size={17} aria-hidden="true" />
      ) : (
        <ShieldCheck size={17} aria-hidden="true" />
      )}
      <span>
        <strong>{labels[state]}</strong>
        <small>
          {verified
            ? `${new Intl.NumberFormat(locale).format(amount)} USDC ${locale === 'vi' ? 'đã khóa' : 'locked'}`
            : locale === 'vi'
              ? 'Không phải xác nhận tài chính'
              : 'Not a financial confirmation'}
        </small>
      </span>
      {verified && explorerUrl && (
        <a href={explorerUrl} target="_blank" rel="noreferrer">
          {locale === 'vi' ? 'Explorer' : 'Explorer'} <ExternalLink size={13} aria-hidden="true" />
        </a>
      )}
    </div>
  );
}

export function ProblemReference({
  problem,
  locale,
  compact = false,
}: {
  problem: ProblemReferenceModel;
  locale: Locale;
  compact?: boolean;
}) {
  return (
    <Link
      className={`v1-reference is-problem${compact ? ' is-compact' : ''}`}
      href={`/${locale}/problems/${problem.slug}`}
    >
      <span className="v1-reference-marker" aria-hidden="true" />
      <span>
        <small>{locale === 'vi' ? 'GIẢI QUYẾT VẤN ĐỀ' : 'SOLVING'}</small>
        <strong>{problem.title}</strong>
        {!compact && <p>{problem.summary}</p>}
      </span>
      <ArrowRight size={17} aria-hidden="true" />
    </Link>
  );
}

export function IdeaReference({ idea, locale }: { idea: IdeaReferenceModel; locale: Locale }) {
  const restricted = idea.visibility !== 'public';
  return (
    <div className={`v1-reference is-idea${restricted ? ' is-restricted' : ''}`}>
      <span className="v1-reference-marker" aria-hidden="true" />
      <span>
        <small>{locale === 'vi' ? 'HƯỚNG ĐƯỢC CHỌN' : 'SELECTED DIRECTION'}</small>
        <strong>
          {restricted ? (locale === 'vi' ? 'Ý tưởng bị giới hạn' : 'Restricted Idea') : idea.title}
        </strong>
        {restricted && (
          <p>
            {locale === 'vi'
              ? 'Nội dung không hiển thị công khai.'
              : 'Content is not publicly visible.'}
          </p>
        )}
      </span>
      <LockKeyhole size={17} aria-hidden="true" />
    </div>
  );
}
