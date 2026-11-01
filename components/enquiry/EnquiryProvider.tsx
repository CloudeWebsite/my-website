"use client";

import { AnimatePresence } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { EnquiryForm } from "./EnquiryForm";

type Ctx = { open: () => void; close: () => void };
const EnquiryContext = createContext<Ctx>({ open: () => undefined, close: () => undefined });
export const useEnquiry = () => useContext(EnquiryContext);

export function EnquiryProvider({ children, budgets, studioName }: { children: ReactNode; budgets: string[]; studioName: string }) {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);

  // Any element with [data-enquire] opens the form — lets server components trigger it.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest("[data-enquire]");
      if (!el) return;
      e.preventDefault();
      setOpen(true);
    };
    document.addEventListener("click", onClick);
    if (window.location.hash === "#enquire") setOpen(true);
    return () => document.removeEventListener("click", onClick);
  }, []);

  const value = useMemo(() => ({ open, close }), [open, close]);
  return (
    <EnquiryContext.Provider value={value}>
      {children}
      <AnimatePresence>{isOpen && <EnquiryForm key="enquiry" onClose={close} budgets={budgets} studioName={studioName} />}</AnimatePresence>
    </EnquiryContext.Provider>
  );
}
