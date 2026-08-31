export default function Loading() {
  return (
    <main className="detail-page" aria-busy="true">
      <div className="detail-kicker skeleton" />
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-copy" />
      <span className="sr-only">Loading</span>
    </main>
  );
}
