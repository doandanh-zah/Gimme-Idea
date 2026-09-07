export function PageSkeleton() {
  return (
    <main id="main" className="page-skeleton" aria-busy="true" role="status">
      <span className="sr-only">Loading / Đang tải</span>
      <div className="skeleton skeleton-eyebrow" />
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-description" />
      <div className="skeleton-records" aria-hidden="true">
        {[0, 1, 2].map((index) => (
          <div className="skeleton-record" key={index}>
            <div className="skeleton skeleton-eyebrow" />
            <div className="skeleton skeleton-heading" />
            <div className="skeleton skeleton-description" />
            <div className="skeleton skeleton-description" />
          </div>
        ))}
      </div>
    </main>
  );
}
