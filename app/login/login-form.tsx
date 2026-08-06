"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(login, initialState);
  return (
    <form action={action} className="card">
      <label htmlFor="password">Local passphrase</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required />
      {state.error ? <p className="error">{state.error}</p> : null}
      <button type="submit" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
