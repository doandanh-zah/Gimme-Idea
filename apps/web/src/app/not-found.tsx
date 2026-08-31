import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="center-state">
      <p className="eyebrow">404 / DISCONNECTED NODE</p>
      <h1>This node is not in the network.</h1>
      <Link className="button button-primary" href="/en">
        Return to Gimme Idea
      </Link>
    </main>
  );
}
