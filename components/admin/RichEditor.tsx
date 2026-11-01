"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cx } from "@/lib/utils";

/** Tiptap editor limited to the nodes our renderer whitelists. */
export function RichEditor({ value, onChange, label }: { value: JSONContent; onChange: (doc: JSONContent) => void; label: string }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, codeBlock: false, code: false, strike: false, underline: false, link: { openOnClick: false, autolink: true, protocols: ["http", "https", "mailto", "tel"] } })],
    content: value,
    editorProps: { attributes: { class: "a-rte__content prose-admin", "aria-label": label, role: "textbox", "aria-multiline": "true" } },
    onUpdate: ({ editor: e }) => onChange(e.getJSON()),
  });
  if (!editor) return <div className="a-rte a-rte--loading" />;
  const btn = (name: string, active: boolean, run: () => void, title: string) => (
    <button type="button" className={cx("a-rte__btn", active && "is-on")} onClick={run} title={title} aria-pressed={active}>
      {name}
    </button>
  );
  return (
    <div className="a-field">
      <span className="a-mono">{label}</span>
      <div className="a-rte">
        <div className="a-rte__bar" role="toolbar" aria-label="Formatting">
          {btn("P", editor.isActive("paragraph"), () => editor.chain().focus().setParagraph().run(), "Paragraph")}
          {btn("H2", editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), "Heading")}
          {btn("H3", editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), "Subheading")}
          {btn("B", editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), "Bold")}
          {btn("I", editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), "Italic")}
          {btn("• List", editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), "Bulleted list")}
          {btn("1. List", editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), "Numbered list")}
          {btn("“ Quote", editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), "Quote")}
          {btn(
            "Link",
            editor.isActive("link"),
            () => {
              const prev = (editor.getAttributes("link").href as string | undefined) ?? "";
              const url = window.prompt("Link URL (https://, mailto:, or /path)", prev);
              if (url === null) return;
              if (url === "") editor.chain().focus().unsetLink().run();
              else editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
            },
            "Link",
          )}
          {btn("↶", false, () => editor.chain().focus().undo().run(), "Undo")}
          {btn("↷", false, () => editor.chain().focus().redo().run(), "Redo")}
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
