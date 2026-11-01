import type { ReactNode } from "react";

/**
 * Renders a Tiptap/ProseMirror JSON document to React.
 * Only whitelisted nodes and marks are rendered and links are restricted to
 * safe protocols, so stored content can never inject HTML or scripts.
 */
type Mark = { type: string; attrs?: Record<string, unknown> };
type Node = { type: string; text?: string; marks?: Mark[]; attrs?: Record<string, unknown>; content?: Node[] };

function safeHref(href: unknown): string | null {
  if (typeof href !== "string") return null;
  const v = href.trim();
  if (/^(https?:|mailto:|tel:)/i.test(v) || v.startsWith("/") || v.startsWith("#")) return v;
  return null;
}

function renderText(node: Node, key: number): ReactNode {
  let el: ReactNode = node.text ?? "";
  for (const mark of node.marks ?? []) {
    if (mark.type === "bold") el = <strong>{el}</strong>;
    else if (mark.type === "italic") el = <em>{el}</em>;
    else if (mark.type === "code") el = <code>{el}</code>;
    else if (mark.type === "link") {
      const href = safeHref(mark.attrs?.href);
      if (href) el = <a href={href} className="link-u" rel={href.startsWith("http") ? "noopener noreferrer" : undefined} target={href.startsWith("http") ? "_blank" : undefined}>{el}</a>;
    }
  }
  return <span key={key}>{el}</span>;
}

function renderNodes(nodes: Node[] | undefined): ReactNode[] {
  return (nodes ?? []).map((n, i) => renderNode(n, i));
}

function renderNode(node: Node, key: number): ReactNode {
  switch (node.type) {
    case "text":
      return renderText(node, key);
    case "paragraph":
      return <p key={key}>{renderNodes(node.content)}</p>;
    case "heading": {
      const level = Number(node.attrs?.level ?? 2);
      return level <= 2 ? <h2 key={key}>{renderNodes(node.content)}</h2> : <h3 key={key}>{renderNodes(node.content)}</h3>;
    }
    case "bulletList":
      return <ul key={key}>{renderNodes(node.content)}</ul>;
    case "orderedList":
      return <ol key={key}>{renderNodes(node.content)}</ol>;
    case "listItem":
      return <li key={key}>{renderNodes(node.content)}</li>;
    case "blockquote":
      return <blockquote key={key}>{renderNodes(node.content)}</blockquote>;
    case "hardBreak":
      return <br key={key} />;
    case "horizontalRule":
      return <hr key={key} />;
    default:
      return null;
  }
}

export function RichText({ doc, className }: { doc: unknown; className?: string }) {
  const root = doc as Node | null;
  if (!root || root.type !== "doc") return null;
  return <div className={className ?? "prose"}>{renderNodes(root.content)}</div>;
}

/** Plain-text extraction (excerpts, meta descriptions, reading time). */
export function docToText(doc: unknown): string {
  const walk = (n: Node): string => (n.text ?? "") + (n.content ?? []).map(walk).join(n.type === "doc" ? "\n\n" : "");
  const root = doc as Node | null;
  return root && root.type === "doc" ? walk(root).trim() : "";
}

/** Build a simple doc from plain paragraphs (seed + fallbacks). */
export function paragraphsToDoc(paragraphs: string[]): { type: "doc"; content: Node[] } {
  return { type: "doc", content: paragraphs.map((p) => ({ type: "paragraph", content: [{ type: "text", text: p }] })) };
}
