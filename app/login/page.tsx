import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main>
      <h1>Local sign-in</h1>
      <p className="muted">This app is designed to run only on your machine.</p>
      <LoginForm />
      <p><Link href="/">Back</Link></p>
    </main>
  );
}
