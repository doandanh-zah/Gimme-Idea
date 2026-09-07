import Link from 'next/link';
import type { Locale } from '@gimme-idea/contracts';

export function CatalogPagination({
  locale,
  path,
  page,
  hasNext,
  query = {},
}: {
  locale: Locale;
  path: string;
  page: number;
  hasNext: boolean;
  query?: Record<string, string | undefined>;
}) {
  const href = (next: number) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (next > 1) params.set('page', String(next));
    return `${path}${params.size ? `?${params}` : ''}`;
  };
  if (page === 1 && !hasNext) return null;
  return (
    <nav className="catalog-pagination" aria-label={locale === 'vi' ? 'Phân trang' : 'Pagination'}>
      {page > 1 && (
        <Link className="button button-quiet" href={href(page - 1)} rel="prev">
          {locale === 'vi' ? 'Trang trước' : 'Previous page'}
        </Link>
      )}
      <span aria-current="page">
        {locale === 'vi' ? 'Trang' : 'Page'} {page}
      </span>
      {hasNext && (
        <Link className="button button-quiet" href={href(page + 1)} rel="next">
          {locale === 'vi' ? 'Trang sau' : 'Next page'}
        </Link>
      )}
    </nav>
  );
}
