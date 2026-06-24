import sanitizeHtml from "sanitize-html";

const EMPTY_RICH_TEXT = new Set(["", "<p></p>", "<p><br /></p>", "<p><br></p>"]);

function normalizeAlignment(attribs: Record<string, string | undefined>): Record<string, string> {
  const style = attribs.style ?? "";
  const alignMatch = style.match(/text-align\s*:\s*(left|center|right|justify)/i);
  const dataAlign = attribs["data-align"];
  const align = dataAlign && /^(left|center|right|justify)$/.test(dataAlign)
    ? dataAlign
    : alignMatch?.[1]?.toLowerCase();

  return align ? { "data-align": align } : {};
}

export function sanitizeRichText(value: FormDataEntryValue | string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const cleaned = sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "h2",
      "h3",
      "ul",
      "ol",
      "li",
      "hr",
    ],
    allowedAttributes: {
      h2: ["data-align"],
      h3: ["data-align"],
      p: ["data-align"],
    },
    disallowedTagsMode: "discard",
    enforceHtmlBoundary: true,
    transformTags: {
      h1: "h2",
      h4: "h3",
      h5: "h3",
      h6: "h3",
      b: "strong",
      i: "em",
      p: (_tagName, attribs) => ({ tagName: "p", attribs: normalizeAlignment(attribs) }),
      h2: (_tagName, attribs) => ({ tagName: "h2", attribs: normalizeAlignment(attribs) }),
      h3: (_tagName, attribs) => ({ tagName: "h3", attribs: normalizeAlignment(attribs) }),
    },
  }).trim();

  return EMPTY_RICH_TEXT.has(cleaned) ? null : cleaned;
}

export function richTextToPlainText(value: string | null | undefined) {
  const safeContent = sanitizeRichText(value);

  if (!safeContent) {
    return null;
  }

  const text = sanitizeHtml(safeContent, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/\s+/g, " ")
    .trim();

  return text.length > 0 ? text : null;
}
