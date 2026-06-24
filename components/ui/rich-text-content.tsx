import { sanitizeRichText } from "@/lib/utils/rich-text";

type RichTextContentProps = {
  className?: string;
  content: string | null | undefined;
  dir?: "ltr" | "rtl";
};

export function RichTextContent({ className, content, dir = "ltr" }: RichTextContentProps) {
  const safeContent = sanitizeRichText(content);

  if (!safeContent) {
    return null;
  }

  return (
    <div
      className={["rich-text-content", className].filter(Boolean).join(" ")}
      dir={dir}
      dangerouslySetInnerHTML={{ __html: safeContent }}
    />
  );
}
