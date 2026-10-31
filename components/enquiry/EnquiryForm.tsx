"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { getLenis } from "@/lib/motion";
import { cx, formatBytes } from "@/lib/utils";
import {
  ACCEPTED_FILE_EXT,
  CONTACT_METHODS,
  MAX_FILES,
  OWNS_LAND,
  PROJECT_TYPES,
  enquiryStepSchemas,
  validateFiles,
  type EnquiryInput,
} from "@/lib/validation";

type Draft = { [K in keyof EnquiryInput]: string };
const EMPTY: Draft = { projectType: "", location: "", ownsLand: "", budgetRange: "", timeline: "", description: "", name: "", email: "", phone: "", contactMethod: "" };
const DRAFT_KEY = "studio:enquiry-draft";

const STEPS = [
  { title: "What are you *planning*?", hint: "Choose the closest fit — we'll refine it together." },
  { title: "Where is the *site*?", hint: "Town, suburb or plot reference is enough for now." },
  { title: "An honest *budget range*", hint: "Construction cost, excluding land. It shapes what we propose, never what we judge." },
  { title: "When would you like to *begin*?", hint: "An ideal start month — design typically takes 6 to 9 months before building." },
  { title: "Tell us about the *project*", hint: "How you live, what you love about the site, what isn't working now. Site photos or a survey help." },
  { title: "How do we *reach you*?", hint: "We reply within two working days." },
  { title: "Review your *enquiry*", hint: "Check the details, then send it to the studio." },
] as const;

const LABELS: Record<keyof Draft, string> = {
  projectType: "Project",
  location: "Site",
  ownsLand: "Own the land",
  budgetRange: "Budget",
  timeline: "Start",
  description: "Brief",
  name: "Name",
  email: "Email",
  phone: "Phone",
  contactMethod: "Preferred contact",
};
const STEP_FIELDS: Array<Array<keyof Draft>> = [["projectType"], ["location", "ownsLand"], ["budgetRange"], ["timeline"], ["description"], ["name", "email", "phone", "contactMethod"]];

function Title({ text }: { text: string }) {
  const parts = text.split(/\*(.+?)\*/);
  return <>{parts.map((p, i) => (i % 2 ? <em key={i}>{p}</em> : <span key={i}>{p}</span>))}</>;
}

function monthLabel(v: string): string {
  if (!v) return "";
  const [y, m] = v.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
}

export function EnquiryForm({ onClose, budgets, studioName }: { onClose: () => void; budgets: string[]; studioName: string }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [data, setData] = useState<Draft>(EMPTY);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof Draft | "files" | "form", string>>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done">("idle");
  const [reference, setReference] = useState("");
  const [dragging, setDragging] = useState(false);
  const openedAt = useRef(Date.now());
  const panel = useRef<HTMLDivElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);

  const minMonth = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  // lock page scroll, restore focus, load draft
  useEffect(() => {
    restoreFocus.current = document.activeElement as HTMLElement | null;
    getLenis()?.stop();
    document.documentElement.classList.add("no-scroll");
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) setData({ ...EMPTY, ...(JSON.parse(raw) as Partial<Draft>) });
    } catch {
      /* ignore */
    }
    return () => {
      getLenis()?.start();
      document.documentElement.classList.remove("no-scroll");
      restoreFocus.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    if (status === "done") return;
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(data));
    } catch {
      /* ignore */
    }
  }, [data, status]);

  // focus first field of each step
  useEffect(() => {
    const id = window.setTimeout(() => {
      const el = panel.current?.querySelector<HTMLElement>(".enq__step [autofocus], .enq__step input:not([type=hidden]):not(.hp), .enq__step textarea, .enq__step button");
      el?.focus({ preventScroll: true });
    }, 420);
    return () => window.clearTimeout(id);
  }, [step, status]);

  // escape + focus trap
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]):not(.hp), textarea, select, [href]")).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const set = (key: keyof Draft, value: string) => {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validateStep = (i: number): boolean => {
    if (i >= enquiryStepSchemas.length) return true;
    const schema = enquiryStepSchemas[i];
    const res = schema.safeParse(data);
    const next: typeof errors = {};
    if (!res.success) for (const issue of res.error.issues) next[issue.path[0] as keyof Draft] ??= issue.message;
    if (i === 4) {
      const fileErr = validateFiles(files);
      if (fileErr) next.files = fileErr;
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const go = (to: number) => {
    if (to > step && !validateStep(step)) return;
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

  const addFiles = (list: FileList | File[]) => {
    const merged = [...files, ...Array.from(list)].slice(0, MAX_FILES + 1);
    const err = validateFiles(merged);
    if (err) {
      setErrors((e) => ({ ...e, files: err }));
      setFiles(merged.slice(0, MAX_FILES).filter((f) => !validateFiles([f])));
      return;
    }
    setErrors((e) => ({ ...e, files: undefined }));
    setFiles(merged);
  };

  async function submit() {
    for (let i = 0; i < enquiryStepSchemas.length; i++) {
      if (!validateStep(i)) {
        setDir(-1);
        setStep(i);
        return;
      }
    }
    setStatus("sending");
    const fd = new FormData();
    for (const [k, v] of Object.entries(data)) fd.append(k, v);
    files.forEach((f) => fd.append("files", f));
    fd.append("company", (panel.current?.querySelector<HTMLInputElement>("input[name=company]")?.value ?? ""));
    fd.append("elapsed", String(Date.now() - openedAt.current));
    try {
      const res = await fetch("/api/enquiries", { method: "POST", body: fd });
      const json = (await res.json()) as { reference?: string; error?: string; fieldErrors?: Record<string, string> };
      if (!res.ok || !json.reference) {
        if (json.fieldErrors) setErrors(json.fieldErrors as typeof errors);
        throw new Error(json.error ?? "We couldn't send that. Please try again.");
      }
      setReference(json.reference);
      setStatus("done");
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
    } catch (err) {
      setStatus("idle");
      setErrors((e) => ({ ...e, form: (err as Error).message }));
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step < STEPS.length - 1) go(step + 1);
    else void submit();
  };

  const progress = status === "done" ? 1 : (step + 1) / STEPS.length;
  const err = (k: keyof Draft | "files") =>
    errors[k] ? (
      <p className="enq__error" id={`err-${k}`} role="alert">
        {errors[k]}
      </p>
    ) : null;

  const tiles = (key: keyof Draft, options: readonly string[], cols = 3) => (
    <div className={cx("enq__tiles", `enq__tiles--${cols}`)} role="radiogroup" aria-label={LABELS[key]} aria-describedby={errors[key] ? `err-${key}` : undefined}>
      {options.map((o, i) => (
        <label key={o} className={cx("enq__tile", data[key] === o && "is-on")}>
          <input type="radio" name={key} value={o} checked={data[key] === o} onChange={() => set(key, o)} className="sr-only" />
          <span className="enq__tile-i t-mono">{String(i + 1).padStart(2, "0")}</span>
          <span className="enq__tile-t">{o}</span>
        </label>
      ))}
    </div>
  );

  return (
    <motion.div
      className="enq"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enq-title"
      initial={{ clipPath: "inset(100% 0 0 0)" }}
      animate={{ clipPath: "inset(0% 0 0 0)" }}
      exit={{ clipPath: "inset(0 0 100% 0)" }}
      transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      data-lenis-prevent
    >
      <div className="enq__panel" ref={panel}>
        <div className="enq__top wrap">
          <span className="t-mono">■ {studioName} — New enquiry</span>
          <span className="t-mono enq__count" aria-live="polite">
            {status === "done" ? "Sent" : `${String(step + 1).padStart(2, "0")} / ${String(STEPS.length).padStart(2, "0")}`}
          </span>
          <button type="button" className="enq__close t-mono" onClick={onClose}>
            Close <span aria-hidden="true">✕</span>
          </button>
        </div>
        <div className="enq__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </div>

        <form className="enq__form wrap" onSubmit={onSubmit} noValidate>
          <input name="company" type="text" tabIndex={-1} autoComplete="off" className="hp" aria-hidden="true" />
          <AnimatePresence mode="wait" custom={dir}>
            {status === "done" ? (
              <motion.div key="done" className="enq__step enq__done" initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}>
                <p className="t-mono enq__ref">Reference — {reference}</p>
                <h2 id="enq-title" className="enq__title">
                  Thank you. <em>We have your site in mind.</em>
                </h2>
                <p className="enq__hint">A confirmation is on its way to {data.email}. An architect will read your brief in full and reply within two working days.</p>
                <button type="button" className="btn btn--solid" onClick={onClose}>
                  Return to the site →
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={step}
                className="enq__step"
                custom={dir}
                initial={{ opacity: 0, y: dir * 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: dir * -50 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              >
                <p className="t-mono enq__label">■ Step {String(step + 1).padStart(2, "0")}</p>
                <h2 id="enq-title" className="enq__title">
                  <Title text={STEPS[step].title} />
                </h2>
                <p className="enq__hint">{STEPS[step].hint}</p>

                {step === 0 && (
                  <>
                    {tiles("projectType", PROJECT_TYPES, 3)}
                    {err("projectType")}
                  </>
                )}
                {step === 1 && (
                  <>
                    <div className="enq__field">
                      <label htmlFor="enq-location" className="t-mono">Site location</label>
                      <input id="enq-location" value={data.location} onChange={(e) => set("location", e.target.value)} placeholder="e.g. DHA Phase VIII, Karachi" autoComplete="address-level2" aria-invalid={Boolean(errors.location)} aria-describedby={errors.location ? "err-location" : undefined} />
                      {err("location")}
                    </div>
                    <p className="t-mono enq__sublabel">Do you own the land?</p>
                    {tiles("ownsLand", OWNS_LAND, 3)}
                    {err("ownsLand")}
                  </>
                )}
                {step === 2 && (
                  <>
                    {tiles("budgetRange", budgets, 2)}
                    {err("budgetRange")}
                  </>
                )}
                {step === 3 && (
                  <div className="enq__field">
                    <label htmlFor="enq-timeline" className="t-mono">Ideal start</label>
                    <input id="enq-timeline" type="month" min={minMonth} value={data.timeline} onChange={(e) => set("timeline", e.target.value)} aria-invalid={Boolean(errors.timeline)} aria-describedby={errors.timeline ? "err-timeline" : undefined} />
                    {data.timeline && <p className="t-mono enq__note">{monthLabel(data.timeline)}</p>}
                    {err("timeline")}
                  </div>
                )}
                {step === 4 && (
                  <>
                    <div className="enq__field">
                      <label htmlFor="enq-desc" className="t-mono">Your brief</label>
                      <textarea id="enq-desc" rows={5} value={data.description} onChange={(e) => set("description", e.target.value)} placeholder="Four bedrooms, a north-facing garden, a kitchen that is the heart of the house…" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? "err-description" : undefined} />
                      <span className="t-mono enq__note">{data.description.length} / 4000</span>
                      {err("description")}
                    </div>
                    <div
                      className={cx("enq__drop", dragging && "is-drag")}
                      onDragOver={(e: DragEvent) => {
                        e.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(e: DragEvent) => {
                        e.preventDefault();
                        setDragging(false);
                        addFiles(e.dataTransfer.files);
                      }}
                      data-cursor="drag"
                    >
                      <input ref={fileInput} id="enq-files" type="file" multiple accept={ACCEPTED_FILE_EXT} className="sr-only" onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && addFiles(e.target.files)} />
                      <label htmlFor="enq-files" className="enq__drop-label">
                        <span className="t-mono">+ Attach site photos or survey</span>
                        <span className="enq__note t-mono">PDF, JPG, PNG · up to {MAX_FILES} files · 10 MB each · optional</span>
                      </label>
                      {files.length > 0 && (
                        <ul className="enq__files">
                          {files.map((f, i) => (
                            <li key={`${f.name}-${i}`}>
                              <span>{f.name}</span>
                              <span className="t-mono">{formatBytes(f.size)}</span>
                              <button type="button" className="t-mono" onClick={() => setFiles((fs) => fs.filter((_, j) => j !== i))} aria-label={`Remove ${f.name}`}>
                                Remove
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    {err("files")}
                  </>
                )}
                {step === 5 && (
                  <>
                    <div className="enq__grid2">
                      <div className="enq__field">
                        <label htmlFor="enq-name" className="t-mono">Full name</label>
                        <input id="enq-name" value={data.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? "err-name" : undefined} />
                        {err("name")}
                      </div>
                      <div className="enq__field">
                        <label htmlFor="enq-email" className="t-mono">Email</label>
                        <input id="enq-email" type="email" value={data.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "err-email" : undefined} />
                        {err("email")}
                      </div>
                      <div className="enq__field">
                        <label htmlFor="enq-phone" className="t-mono">Phone / WhatsApp</label>
                        <input id="enq-phone" type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" placeholder="+92 300 000 0000" aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? "err-phone" : undefined} />
                        {err("phone")}
                      </div>
                    </div>
                    <p className="t-mono enq__sublabel">Preferred contact</p>
                    {tiles("contactMethod", CONTACT_METHODS, 3)}
                    {err("contactMethod")}
                  </>
                )}
                {step === 6 && (
                  <dl className="enq__review">
                    {STEP_FIELDS.flatMap((fields, si) =>
                      fields.map((k) => (
                        <div key={k} className="enq__review-row">
                          <dt className="t-mono">{LABELS[k]}</dt>
                          <dd>{k === "timeline" ? monthLabel(data[k]) : data[k] || "—"}</dd>
                          <button type="button" className="t-mono link-u" onClick={() => go(si)}>
                            Edit
                          </button>
                        </div>
                      )),
                    )}
                    <div className="enq__review-row">
                      <dt className="t-mono">Attachments</dt>
                      <dd>{files.length ? files.map((f) => f.name).join(", ") : "None"}</dd>
                      <button type="button" className="t-mono link-u" onClick={() => go(4)}>
                        Edit
                      </button>
                    </div>
                  </dl>
                )}
                {errors.form && (
                  <p className="enq__error" role="alert">
                    {errors.form}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {status !== "done" && (
            <div className="enq__nav">
              <button type="button" className="t-mono link-u" onClick={() => go(step - 1)} disabled={step === 0} style={{ visibility: step === 0 ? "hidden" : "visible" }}>
                ← Back
              </button>
              <span className="t-mono enq__kbd" aria-hidden="true">
                Press Enter ↵
              </span>
              <button type="submit" className="btn btn--solid" disabled={status === "sending"}>
                {status === "sending" ? "Sending…" : step === STEPS.length - 1 ? "Send enquiry →" : "Continue →"}
              </button>
            </div>
          )}
        </form>
      </div>
    </motion.div>
  );
}
