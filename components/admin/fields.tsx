"use client";

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { useId } from "react";

export function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: (id: string, describedBy?: string) => ReactNode }) {
  const id = useId();
  const desc = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className="a-field">
      <label htmlFor={id} className="a-mono">
        {label}
      </label>
      {children(id, desc)}
      {error ? (
        <p id={`${id}-err`} className="a-err" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="a-hint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextInput({ label, error, hint, ...rest }: { label: string; error?: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return <Field label={label} error={error} hint={hint}>{(id, d) => <input id={id} aria-invalid={Boolean(error)} aria-describedby={d} className="a-input" {...rest} />}</Field>;
}

export function TextArea({ label, error, hint, ...rest }: { label: string; error?: string; hint?: string } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Field label={label} error={error} hint={hint}>{(id, d) => <textarea id={id} aria-invalid={Boolean(error)} aria-describedby={d} className="a-input" rows={4} {...rest} />}</Field>;
}

export function Toggle({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className="a-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span className="a-toggle__ui" aria-hidden="true" />
      <span className="a-mono">{label}</span>
    </label>
  );
}
