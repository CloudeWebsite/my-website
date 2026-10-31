import Link from "next/link";

export function Wordmark({ name, tag, subline, href = "/" }: { name: string; tag: string; subline: string; href?: string }) {
  return (
    <Link href={href} className="wordmark" aria-label={`${name} — home`} data-transition-title="Home">
      <span className="wordmark__row">
        <span className="wordmark__name">{name}</span>
        <span className="wordmark__tag">{tag}</span>
      </span>
      <span className="wordmark__sub">{subline}</span>
    </Link>
  );
}
