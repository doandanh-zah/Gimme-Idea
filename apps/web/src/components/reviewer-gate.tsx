'use client';

import { LockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Locale } from '@gimme-idea/contracts';
import { useAuth } from '@/lib/auth';

export function ReviewerGate({ locale, children }: { locale: Locale; children: ReactNode }) {
  const auth = useAuth();
  if (!auth.hydrated || !auth.isSignedIn) {
    return (
      <section className="v1-workspace-lock" data-private-gate="reviewer">
        <LockKeyhole size={30} aria-hidden="true" />
        <p className="v1-kicker">PRIVATE COMPANY AREA</p>
        <h1>{locale === 'vi' ? 'Cần quyền reviewer' : 'Reviewer access required'}</h1>
        <p>
          {locale === 'vi'
            ? 'Hãy đăng nhập. Server sẽ kiểm tra membership và vai trò reviewer trước khi trả nội dung submission.'
            : 'Sign in first. The server checks membership and reviewer role before returning submission content.'}
        </p>
        {auth.hydrated && (
          <small>
            {locale === 'vi'
              ? 'Không có dữ liệu riêng tư nào được nhúng trong HTML công khai.'
              : 'No private submission data is embedded in public HTML.'}
          </small>
        )}
      </section>
    );
  }

  return <>{children}</>;
}
