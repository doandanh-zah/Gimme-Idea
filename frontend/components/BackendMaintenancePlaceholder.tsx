'use client';

import React from 'react';
import { Wrench } from 'lucide-react';

interface BackendMaintenancePlaceholderProps {
  title?: string;
  description?: string;
}

export default function BackendMaintenancePlaceholder({
  title = 'Backend server in maintenance',
  description = 'Các tính năng cần dữ liệu từ server đang tạm thời không khả dụng. Vui lòng thử lại sau.',
}: BackendMaintenancePlaceholderProps) {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-300/20 text-amber-200">
          <Wrench className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-amber-100">{title}</h2>
          <p className="mt-2 text-sm sm:text-base text-amber-50/90">{description}</p>
        </div>
      </div>
    </div>
  );
}
