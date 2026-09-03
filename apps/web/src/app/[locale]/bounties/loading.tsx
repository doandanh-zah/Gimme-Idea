export default function BountiesLoading() {
  return (
    <main id="main" className="app-page bounty-page" aria-busy="true" aria-label="Loading bounties">
      <div className="bounty-page-skeleton bounty-page-skeleton-header" />
      <div className="bounty-page-skeleton bounty-page-skeleton-strip" />
      <div className="bounty-page-skeleton bounty-page-skeleton-card" />
    </main>
  );
}
