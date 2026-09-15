import type { BundledLanguage, Highlighter } from "shiki";

export interface Highlighted {
  spans: RenderSpan[];
  bg: string;
  fg: string;
}

const ITALIC = 1;
const BOLD = 2;
const UNDERLINE = 4;

const pairs = shallowReactive(new Map<string, boolean>());

const cache = new Map<string, { key: string; value: Highlighted }>();

let highlighter: Highlighter | undefined;

function tokenStyle(token: { color?: string; fontStyle?: number }) {
  const style: Record<string, string | number> = {};

  if (token.color) style.color = token.color;

  const font = token.fontStyle ?? 0;

  if (font & ITALIC) style.fontStyle = "italic";
  if (font & BOLD) style.fontWeight = "bold";
  if (font & UNDERLINE) style.textDecoration = "underline";

  return style;
}

function load(key: string, language: string, theme: string) {
  if (pairs.has(key)) return;

  pairs.set(key, false);

  import("shiki")
    .then(({ getSingletonHighlighter }) =>
      getSingletonHighlighter({ langs: [language], themes: [theme] }),
    )
    .then((loaded) => {
      highlighter = loaded;

      pairs.set(key, true);
    })
    .catch((error) => console.error(error));
}

export function highlight(
  id: string,
  source: string,
  language: string,
  theme: string,
): Highlighted | undefined {
  const pair = `${language}\u0000${theme}`;

  if (!pairs.get(pair) || !highlighter) {
    load(pair, language, theme);

    return undefined;
  }

  const key = `${pair}\u0000${source}`;
  const hit = cache.get(id);

  if (hit?.key === key) return hit.value;

  const result = highlighter.codeToTokens(source, {
    lang: language as BundledLanguage,
    theme,
  });

  const spans: RenderSpan[] = [];

  result.tokens.forEach((line, index) => {
    if (index) spans.push({ text: "\n" });

    for (const token of line)
      spans.push({ text: token.content, style: tokenStyle(token) });
  });

  const value = { spans, bg: result.bg ?? "", fg: result.fg ?? "" };

  cache.set(id, { key, value });

  return value;
}
