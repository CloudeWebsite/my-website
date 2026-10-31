import { SectionLabel } from "./SectionLabel";
import { Emph } from "./Emph";

export function PageHead({ label, title, lead, theme = "dark", index }: { label: string; title: string; lead?: string; theme?: "dark" | "light"; index?: string }) {
  return (
    <section className="section page-head" data-theme={theme}>
      <div className="wrap">
        <SectionLabel index={index}>{label}</SectionLabel>
        <h1 className="page-head__title" data-reveal="lines">
          <Emph text={title} />
        </h1>
        {lead && (
          <p className="page-head__lead" data-reveal="fade">
            {lead}
          </p>
        )}
      </div>
    </section>
  );
}
