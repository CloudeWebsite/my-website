"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { saveSetting } from "@/app/admin/actions";
import type { Settings } from "@/lib/settings";
import { TextArea, TextInput } from "./fields";
import { useToast } from "./Toast";

function useSaver<K extends keyof Settings>(key: K) {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();
  const router = useRouter();
  const save = async (value: Settings[K]) => {
    setBusy(true);
    const res = await saveSetting(key, value);
    setBusy(false);
    if (!res.ok) {
      setErrors(res.fieldErrors ?? {});
      toast(res.error, "error");
    } else {
      setErrors({});
      toast(res.message ?? "Saved.");
      router.refresh();
    }
  };
  return { busy, errors, save };
}

function Card({ title, children, onSave, busy }: { title: string; children: React.ReactNode; onSave: () => void; busy: boolean }) {
  return (
    <form
      className="a-panel a-form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <h2 className="a-h2">{title}</h2>
      {children}
      <div className="a-row a-row--end">
        <button type="submit" className="a-btn" disabled={busy}>
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

export function SettingsForm({ settings }: { settings: Settings }) {
  const [studio, setStudio] = useState(settings.studio);
  const [socials, setSocials] = useState(settings.socials);
  const [stats, setStats] = useState(settings.stats);
  const [hero, setHero] = useState(settings.hero);
  const [budgets, setBudgets] = useState(settings.budgets.join("\n"));
  const s1 = useSaver("studio");
  const s2 = useSaver("socials");
  const s3 = useSaver("stats");
  const s4 = useSaver("hero");
  const s5 = useSaver("budgets");

  const studioField = (k: keyof typeof studio, label: string, hint?: string) => (
    <TextInput label={label} hint={hint} error={s1.errors[k]} value={String(studio[k])} type={typeof studio[k] === "number" ? "number" : "text"} onChange={(e) => setStudio((p) => ({ ...p, [k]: typeof p[k] === "number" ? Number(e.target.value) : e.target.value }))} />
  );

  return (
    <div className="a-stack">
      <Card title="Studio & contact" busy={s1.busy} onSave={() => s1.save(studio)}>
        <div className="a-form__grid">
          {studioField("name", "Studio name (wordmark)")}
          {studioField("regionTag", "Region tag", "Two letters, e.g. PK")}
          {studioField("subline", "Sub-line")}
          {studioField("city", "City")}
          {studioField("country", "Country")}
          {studioField("coordinates", "Coordinates")}
          {studioField("timezone", "Time zone (IANA)", "e.g. Asia/Karachi")}
          {studioField("timezoneLabel", "Time zone label", "e.g. PKT")}
          {studioField("email", "Email")}
          {studioField("phone", "Phone")}
          {studioField("whatsapp", "WhatsApp")}
          {studioField("currency", "Currency")}
          {studioField("foundedYear", "Founded")}
          {studioField("mapUrl", "Map link")}
        </div>
        <TextArea label="Address" rows={2} value={studio.address} error={s1.errors.address} onChange={(e) => setStudio((p) => ({ ...p, address: e.target.value }))} />
      </Card>

      <Card title="Hero stages" busy={s4.busy} onSave={() => s4.save(hero)}>
        <p className="a-hint">Wrap words in *asterisks* to set them in italic.</p>
        {hero.stages.map((st, i) => (
          <div key={i} className="a-form__grid a-sep">
            <TextInput label={`Stage ${i + 1} label`} value={st.label} onChange={(e) => setHero((h) => ({ stages: h.stages.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) }))} />
            <TextInput label="Tab" value={st.tab} onChange={(e) => setHero((h) => ({ stages: h.stages.map((x, j) => (j === i ? { ...x, tab: e.target.value } : x)) }))} />
            <TextInput label="Headline" value={st.headline} onChange={(e) => setHero((h) => ({ stages: h.stages.map((x, j) => (j === i ? { ...x, headline: e.target.value } : x)) }))} />
            <TextInput label="Body" value={st.body} onChange={(e) => setHero((h) => ({ stages: h.stages.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) }))} />
          </div>
        ))}
      </Card>

      <Card title="Studio statistics" busy={s3.busy} onSave={() => s3.save(stats)}>
        {stats.map((st, i) => (
          <div key={i} className="a-form__grid a-form__grid--3">
            <TextInput label="Value" type="number" value={st.value} onChange={(e) => setStats((xs) => xs.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)))} />
            <TextInput label="Suffix" value={st.suffix} onChange={(e) => setStats((xs) => xs.map((x, j) => (j === i ? { ...x, suffix: e.target.value } : x)))} />
            <TextInput label="Label" value={st.label} onChange={(e) => setStats((xs) => xs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
          </div>
        ))}
      </Card>

      <Card title="Enquiry budget ranges" busy={s5.busy} onSave={() => s5.save(budgets.split("\n").map((b) => b.trim()).filter(Boolean))}>
        <TextArea label="One range per line" rows={6} value={budgets} error={s5.errors.form} onChange={(e) => setBudgets(e.target.value)} />
      </Card>

      <Card title="Social links" busy={s2.busy} onSave={() => s2.save(socials)}>
        <div className="a-form__grid">
          {(Object.keys(socials) as Array<keyof typeof socials>).map((k) => (
            <TextInput key={k} label={k} value={socials[k]} error={s2.errors[k]} onChange={(e) => setSocials((p) => ({ ...p, [k]: e.target.value }))} />
          ))}
        </div>
      </Card>
    </div>
  );
}
