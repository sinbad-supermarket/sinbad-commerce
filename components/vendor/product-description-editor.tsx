"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { sanitizeRichText } from "@/lib/utils/rich-text";

type ProductDescriptionEditorProps = {
  dir?: "ltr" | "rtl";
  initialValue?: string | null;
  label: string;
  name: string;
  readOnly?: boolean;
};

function isSafeUrl(url: string) {
  return /^(https?:|mailto:|tel:)/i.test(url);
}

export function ProductDescriptionEditor({
  dir = "ltr",
  initialValue,
  label,
  name,
  readOnly = false,
}: ProductDescriptionEditorProps) {
  const [html, setHtml] = useState(() => sanitizeRichText(initialValue) ?? "");
  const extensions = useMemo(
    () => [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: {
          levels: [2, 3],
        },
        strike: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
      Link.configure({
        autolink: false,
        defaultProtocol: "https",
        HTMLAttributes: {
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
        openOnClick: false,
        protocols: ["http", "https", "mailto", "tel"],
      }),
    ],
    [],
  );

  const editor = useEditor({
    immediatelyRender: false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        "aria-label": label,
        class: "rich-text-editor-surface",
        dir,
      },
      handlePaste(view, event) {
        const clipboard = event.clipboardData;
        if (!clipboard) {
          return false;
        }

        const pastedHtml = clipboard.getData("text/html");
        if (!pastedHtml) {
          return false;
        }

        const safeHtml = sanitizeRichText(pastedHtml);
        if (!safeHtml) {
          const text = clipboard.getData("text/plain");
          view.dispatch(view.state.tr.insertText(text));
          return true;
        }

        editor?.commands.insertContent(safeHtml);
        return true;
      },
    },
    extensions,
    content: html || "<p></p>",
    onUpdate({ editor: activeEditor }) {
      setHtml(sanitizeRichText(activeEditor.getHTML()) ?? "");
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  const run = useCallback(
    (command: () => void) => {
      if (readOnly) {
        return;
      }

      command();
      editor?.commands.focus();
    },
    [editor, readOnly],
  );

  const setLink = useCallback(() => {
    if (!editor || readOnly) {
      return;
    }

    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter a safe link URL", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    if (!isSafeUrl(trimmedUrl)) {
      window.alert("Only http, https, mailto, and tel links are allowed.");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: trimmedUrl }).run();
  }, [editor, readOnly]);

  return (
    <div className="field rich-text-field">
      <span>{label}</span>
      <input name={name} type="hidden" value={html} />
      <div className="rich-text-editor">
        <div className="rich-text-toolbar" aria-label={`${label} formatting tools`}>
          <button
            aria-label="Bold"
            className={editor?.isActive("bold") ? "active" : ""}
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().toggleBold().run())}
            type="button"
          >
            B
          </button>
          <button
            aria-label="Italic"
            className={editor?.isActive("italic") ? "active" : ""}
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().toggleItalic().run())}
            type="button"
          >
            I
          </button>
          <button
            aria-label="Underline"
            className={editor?.isActive("underline") ? "active" : ""}
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().toggleUnderline().run())}
            type="button"
          >
            U
          </button>
          <button
            aria-label="Heading 2"
            className={editor?.isActive("heading", { level: 2 }) ? "active" : ""}
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().toggleHeading({ level: 2 }).run())}
            type="button"
          >
            H2
          </button>
          <button
            aria-label="Heading 3"
            className={editor?.isActive("heading", { level: 3 }) ? "active" : ""}
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().toggleHeading({ level: 3 }).run())}
            type="button"
          >
            H3
          </button>
          <button
            aria-label="Bullet list"
            className={editor?.isActive("bulletList") ? "active" : ""}
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().toggleBulletList().run())}
            type="button"
          >
            UL
          </button>
          <button
            aria-label="Numbered list"
            className={editor?.isActive("orderedList") ? "active" : ""}
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().toggleOrderedList().run())}
            type="button"
          >
            1.
          </button>
          <button
            aria-label="Align left"
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().setTextAlign("left").run())}
            type="button"
          >
            L
          </button>
          <button
            aria-label="Align center"
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().setTextAlign("center").run())}
            type="button"
          >
            C
          </button>
          <button
            aria-label="Align right"
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().setTextAlign("right").run())}
            type="button"
          >
            R
          </button>
          <button
            aria-label="Add link"
            className={editor?.isActive("link") ? "active" : ""}
            disabled={readOnly}
            onClick={setLink}
            type="button"
          >
            Link
          </button>
          <button
            aria-label="Horizontal divider"
            disabled={readOnly}
            onClick={() => run(() => editor?.chain().focus().setHorizontalRule().run())}
            type="button"
          >
            HR
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
      <span className="field-help">
        Formatting is limited to safe marketplace content. External image URLs, raw HTML, scripts,
        embeds, colors, and custom styles are removed.
      </span>
    </div>
  );
}
