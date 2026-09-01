export default function Loading() {
  return (
    <div className="detail-page" role="status" aria-busy="true">
      <div className="detail-kicker skeleton" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-copy" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
