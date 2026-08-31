import { clsx } from 'clsx';
import type { HTMLAttributes, PropsWithChildren } from 'react';

export function Eyebrow({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx('eyebrow', className)} {...props} />;
}
export function StatusPill({
  tone = 'neutral',
  children,
}: PropsWithChildren<{ tone?: 'neutral' | 'success' | 'warning' | 'purple' }>) {
  return <span className={clsx('status-pill', `status-${tone}`)}>{children}</span>;
}
