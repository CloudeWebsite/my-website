"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

type Ask = (opts: { title: string; body?: string; confirm?: string; danger?: boolean }) => Promise<boolean>;
const Ctx = createContext<Ask>(async () => false);
export const useConfirm = () => useContext(Ctx);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const [opts, setOpts] = useState<{ title: string; body?: string; confirm?: string; danger?: boolean }>({ title: "" });
  const ask = useCallback<Ask>((o) => {
    setOpts(o);
    dialog.current?.showModal();
    return new Promise<boolean>((res) => {
      resolver.current = res;
    });
  }, []);
  const close = (v: boolean) => {
    dialog.current?.close();
    resolver.current?.(v);
    resolver.current = null;
  };
  return (
    <Ctx.Provider value={ask}>
      {children}
      <dialog ref={dialog} className="a-dialog" onCancel={() => close(false)} aria-labelledby="confirm-title">
        <p className="a-mono">■ Please confirm</p>
        <h2 id="confirm-title">{opts.title}</h2>
        {opts.body && <p className="a-muted">{opts.body}</p>}
        <div className="a-row a-row--end">
          <button type="button" className="a-btn a-btn--ghost" onClick={() => close(false)} autoFocus>
            Cancel
          </button>
          <button type="button" className={`a-btn ${opts.danger ? "a-btn--danger" : ""}`} onClick={() => close(true)}>
            {opts.confirm ?? "Confirm"}
          </button>
        </div>
      </dialog>
    </Ctx.Provider>
  );
}
