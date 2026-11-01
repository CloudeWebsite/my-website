import type { ReactNode } from "react";
import { PageHead } from "./PageHead";

export function Legal({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <PageHead label={`Last updated ${updated}`} title={title} />
      <section className="section legal" data-theme="light">
        <div className="wrap">
          <div className="prose">{children}</div>
        </div>
      </section>
    </>
  );
}
