export function SectionLabel({ index, children, className }: { index?: string; children: React.ReactNode; className?: string }) {
  return (
    <p className={`label t-mono ${className ?? ""}`}>
      <span className="label__sq" aria-hidden="true">■</span>
      {index && <span>{index} /</span>} {children}
    </p>
  );
}
