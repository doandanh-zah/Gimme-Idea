'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RefreshCw, Unplug } from 'lucide-react';

export default function ErrorState({ reset }: { error: Error; reset: () => void }) {
  const params = useParams();
  const vi = params.locale === 'vi';
  return (
    <main id="main" className="center-state network-error">
      <Unplug size={36} aria-hidden="true" />
      <p className="eyebrow">{vi ? 'KẾT NỐI TẠM THỜI GIÁN ĐOẠN' : 'A PAUSE IN THE CONNECTION'}</p>
      <h1>{vi ? 'Chưa tải được nội dung.' : 'We couldn’t load this page.'}</h1>
      <p>
        {vi
          ? 'Vui lòng thử lại. Bạn cũng có thể quay về trang khám phá.'
          : 'Please try again, or head back to explore the network.'}
      </p>
      <div>
        <button type="button" className="button button-primary" onClick={reset}>
          <RefreshCw size={18} aria-hidden="true" />
          {vi ? 'Thử lại' : 'Try again'}
        </button>
        <Link className="button button-quiet" href={`/${vi ? 'vi' : 'en'}/home`}>
          {vi ? 'Về trang chủ' : 'Back to Home'}
        </Link>
      </div>
    </main>
  );
}
