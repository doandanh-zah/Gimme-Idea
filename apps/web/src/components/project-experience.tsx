import type { Locale } from '@gimme-idea/contracts';
import type { ProjectModel } from '@/lib/domain/types';
import { RestrictedGate } from '@/components/v1-primitives';

export function PrivateProjectWorkspace({ locale }: { project: ProjectModel; locale: Locale }) {
  return (
    <RestrictedGate
      locale={locale}
      body={
        locale === 'vi'
          ? 'Không gian dự án riêng tư chưa khả dụng. Quyền truy cập cần được xác nhận bởi hệ thống.'
          : 'Private project workspaces are not available yet. Access must be confirmed by the service.'
      }
    />
  );
}
