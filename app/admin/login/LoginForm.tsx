"use client";

import { useActionState } from "react";
import { loginAction } from "../actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  return (
    <form action={action} className="a-form">
      <input type="hidden" name="next" value={next} />
      <div className="a-field">
        <label htmlFor="email" className="a-mono">Email</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="a-input" defaultValue={state?.email ?? ""} key={state?.email ?? "e"} />
      </div>
      <div className="a-field">
        <label htmlFor="password" className="a-mono">Password</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="a-input" />
      </div>
      {state?.error && (
        <p className="a-err" role="alert">
          {state.error}
        </p>
      )}
      <button type="submit" className="a-btn a-btn--block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in →"}
      </button>
    </form>
  );
}
