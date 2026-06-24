"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

  const blockValue = editor?.isActive("heading", { level: 2 })
    ? "h2"
    : editor?.isActive("heading", { level: 3 })
      ? "h3"
      : "paragraph";

  return (
    <div className="field rich-text-field">
      <span>{label}</span>
      <input name={name} type="hidden" value={html} />
      <div className="rich-text-editor">
        <div className="rich-text-toolbar" aria-label={`${label} formatting tools`}>
          <select
            aria-label="Text style"
            className="rich-text-style-select"
            disabled={readOnly}
            onChange={(event) => {
              const value = event.target.value;
              run(() => {
                if (value === "h2") {
                  editor?.chain().focus().setHeading({ level: 2 }).run();
                  return;
                }

                if (value === "h3") {
                  editor?.chain().focus().setHeading({ level: 3 }).run();
                  return;
                }

                editor?.chain().focus().setParagraph().run();
              });
            }}
            value={blockValue}
          >
            <option value="paragraph">Normal</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <div className="rich-text-button-group" role="group" aria-label="Text formatting">
            <button
              aria-label="Bold"
              className={editor?.isActive("bold") ? "active" : ""}
              disabled={readOnly}
              onClick={() => run(() => editor?.chain().focus().toggleBold().run())}
              type="button"
            >
              <strong>B</strong>
            </button>
            <button
              aria-label="Italic"
              className={editor?.isActive("italic") ? "active" : ""}
              disabled={readOnly}
              onClick={() => run(() => editor?.chain().focus().toggleItalic().run())}
              type="button"
            >
              <em>I</em>
            </button>
            <button
              aria-label="Underline"
              className={editor?.isActive("underline") ? "active" : ""}
              disabled={readOnly}
              onClick={() => run(() => editor?.chain().focus().toggleUnderline().run())}
              type="button"
            >
              <span className="toolbar-underline-icon">U</span>
            </button>
          </div>

          <div className="rich-text-button-group" role="group" aria-label="Lists">
            <button
              aria-label="Bullet list"
              className={editor?.isActive("bulletList") ? "active" : ""}
              disabled={readOnly}
              onClick={() => run(() => editor?.chain().focus().toggleBulletList().run())}
              type="button"
            >
              <span className="toolbar-list-icon toolbar-list-icon-bullets" aria-hidden="true" />
            </button>
            <button
              aria-label="Numbered list"
              className={editor?.isActive("orderedList") ? "active" : ""}
              disabled={readOnly}
              onClick={() => run(() => editor?.chain().focus().toggleOrderedList().run())}
              type="button"
            >
              <span className="toolbar-list-icon toolbar-list-icon-numbers" aria-hidden="true" />
            </button>
          </div>

          <div className="rich-text-button-group" role="group" aria-label="Alignment">
            <button
              aria-label="Align left"
              disabled={readOnly}
              onClick={() => run(() => editor?.chain().focus().setTextAlign("left").run())}
              type="button"
            >
              <span className="toolbar-align-icon toolbar-align-left" aria-hidden="true" />
            </button>
            <button
              aria-label="Align center"
              disabled={readOnly}
              onClick={() => run(() => editor?.chain().focus().setTextAlign("center").run())}
              type="button"
            >
              <span className="toolbar-align-icon toolbar-align-center" aria-hidden="true" />
            </button>
            <button
              aria-label="Align right"
              disabled={readOnly}
              onClick={() => run(() => editor?.chain().focus().setTextAlign("right").run())}
              type="button"
            >
              <span className="toolbar-align-icon toolbar-align-right" aria-hidden="true" />
            </button>
          </div>

          <div className="rich-text-button-group" role="group" aria-label="Insert">
            <button
              aria-label="Horizontal divider"
              disabled={readOnly}
              onClick={() => run(() => editor?.chain().focus().setHorizontalRule().run())}
              type="button"
            >
              <span className="toolbar-divider-icon" aria-hidden="true" />
            </button>
          </div>
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
