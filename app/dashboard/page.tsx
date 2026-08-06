import Link from "next/link";
import { requireLocalSession } from "@/auth/session";

export default async function DashboardPage() {
  await requireLocalSession();
  return (
    <main>
      <h1>AI Editorial Board</h1>
      <p className="muted">Milestone 1 foundation is running. Conversational intake begins in Milestone 3.</p>
      <div className="card">
        <h2>What are you thinking about?</h2>
        <p>The idea workspace will be enabled after the content-loading and intake milestones are complete.</p>
      </div>
      <p><Link href="/api/health">View local readiness status</Link></p>
    </main>
  );
}
