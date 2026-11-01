import type { ReactNode } from "react";

export function PageTitle({ index, title, children }: { index: string; title: string; children?: ReactNode }) {
  return (
    <header className="a-head">
      <div>
        <p className="a-mono">■ {index}</p>
        <h1>{title}</h1>
      </div>
      {children && <div className="a-row">{children}</div>}
    </header>
  );
}
