"use client";

import { useState, type FormEvent } from "react";

export function Newsletter() {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setState("sending");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email"), website: data.get("website") }),
      });
      const json = (await res.json()) as { message?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Please try again.");
      setState("done");
      setMessage(json.message ?? "Check your inbox to confirm.");
      form.reset();
    } catch (err) {
      setState("error");
      setMessage((err as Error).message);
    }
  }

  return (
    <form className="newsletter" onSubmit={onSubmit} noValidate>
      <label htmlFor="nl-email" className="t-mono newsletter__label">
        Studio notes — a few letters a year
      </label>
      <div className="newsletter__row">
        <input id="nl-email" name="email" type="email" required placeholder="Email address" autoComplete="email" disabled={state === "sending"} />
        <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
        <button type="submit" className="newsletter__btn" disabled={state === "sending"} aria-label="Subscribe">
          {state === "sending" ? "…" : "→"}
        </button>
      </div>
      <p className="newsletter__msg t-mono" role="status" aria-live="polite">
        {state === "done" || state === "error" ? message : " "}
      </p>
    </form>
  );
}
