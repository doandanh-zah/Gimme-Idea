import type { Locale } from '@gimme-idea/contracts';
import type { BountyModel } from '@/lib/domain/types';
import { LockKeyhole } from 'lucide-react';

export function BuildAccessPanel({ bounty, locale }: { bounty: BountyModel; locale: Locale }) {
  return (
    <section className="v1-join-gate">
      <LockKeyhole size={26} aria-hidden="true" />
      <h2>
        {locale === 'vi' ? 'Tham gia Build chưa khả dụng' : 'Build enrollment is not available yet'}
      </h2>
      <p>{bounty.title}</p>
      <p>
        {locale === 'vi'
          ? 'Quyền tham gia và không gian dự án riêng tư chưa được kết nối. Bạn có thể đọc yêu cầu công khai của Bounty.'
          : 'Enrollment and private project access are not connected yet. You can read the public Bounty requirements.'}
      </p>
    </section>
  );
}
