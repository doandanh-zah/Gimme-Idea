import Link from 'next/link';
import { headers } from 'next/headers';
export default async function NotFound() {
  const locale = (await headers()).get('x-gimme-locale') === 'vi' ? 'vi' : 'en';
  return (
    <main className="center-state">
      <p className="eyebrow">404</p>
      <h1>{locale === 'vi' ? 'Không tìm thấy trang này.' : 'This page could not be found.'}</h1>
      <p>
        {locale === 'vi'
          ? 'Đường dẫn có thể đã thay đổi hoặc nội dung không còn khả dụng.'
          : 'The link may have changed or the content is no longer available.'}
      </p>
      <Link className="button button-primary" href={`/${locale}/home`}>
        {locale === 'vi' ? 'Về trang chủ' : 'Go home'}
      </Link>
      <Link className="button button-quiet" href={`/${locale}/search`}>
        {locale === 'vi' ? 'Tìm kiếm' : 'Search'}
      </Link>
    </main>
  );
}
