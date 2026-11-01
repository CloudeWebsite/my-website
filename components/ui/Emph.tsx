import { parseEmphasis } from "@/lib/utils";

/** Renders "Text *italic*" with <em> runs. */
export function Emph({ text }: { text: string }) {
  return (
    <>
      {parseEmphasis(text).map((r, i) => (r.em ? <em key={i}>{r.text}</em> : <span key={i}>{r.text}</span>))}
    </>
  );
}
