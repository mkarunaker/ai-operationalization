import Link from "next/link";
import { getLocalSession } from "@/auth/session";

export default async function HomePage() {
  const session = await getLocalSession();
  return (
    <main>
      <h1>AI Editorial Board</h1>
      <p className="muted">A private local workspace for developing and reviewing your ideas.</p>
      <div className="card">
        {session ? <Link href="/dashboard">Open workspace</Link> : <Link href="/login">Sign in locally</Link>}
      </div>
    </main>
  );
}
