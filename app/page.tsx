import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>AI Editorial Board</h1>
      <p className="muted">A private local workspace for developing and reviewing your ideas.</p>
      <div className="card">
        <Link href="/dashboard">Open workspace</Link>
      </div>
    </main>
  );
}
