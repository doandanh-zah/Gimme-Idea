'use client';
import Link from 'next/link';
import { ArrowLeft, Lightbulb, Target } from 'lucide-react';
import { useEffect } from 'react';
import type { Locale } from '@gimme-idea/contracts';

export function CreateRouteNotice({ locale, type }: { locale: Locale; type: 'idea' | 'problem' }) {
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('gimme-open-create', { detail: { type } }));
  }, [type]);
  const Icon = type === 'idea' ? Lightbulb : Target;
  return (
    <section className={`v1-create-route is-${type}`}>
      <Icon size={30} aria-hidden="true" />
      <p className="v1-kicker">CREATE / {type.toUpperCase()}</p>
      <h1>
        {type === 'problem'
          ? locale === 'vi'
            ? 'Đăng điều cần được giải quyết'
            : 'Publish what needs to be solved'
          : locale === 'vi'
            ? 'Đề xuất một hướng công khai'
            : 'Propose a public direction'}
      </h1>
      <p>
        {type === 'problem'
          ? locale === 'vi'
            ? 'Problem có thể tồn tại mà không có Idea hoặc Bounty. Funding chỉ bắt đầu sau khi Problem được xuất bản.'
            : 'A Problem can exist without an Idea or Bounty. Funding begins only after the Problem is published.'
          : locale === 'vi'
            ? 'Mỗi Idea công khai phải có đúng một Primary Problem.'
            : 'Every public Idea must have exactly one Primary Problem.'}
      </p>
      <Link
        className="v1-back-link"
        href={`/${locale}/${type === 'problem' ? 'problems' : 'ideas'}`}
      >
        <ArrowLeft size={15} aria-hidden="true" />
        {locale === 'vi' ? 'Quay lại' : 'Back'}
      </Link>
    </section>
  );
}
