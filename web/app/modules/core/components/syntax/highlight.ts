import type { BundledLanguage, Highlighter } from "shiki";

export interface Highlighted {
  spans: RenderSpan[];
  bg: string;
  fg: string;
}

const ITALIC = 1;
const BOLD = 2;
const UNDERLINE = 4;

const pairs = shallowReactive(new Set<string>());

const cache = new Map<string, { key: string; value: Highlighted }>();
const loads = new Map<string, Promise<void>>();
const pending = new Map<string, Promise<void>>();

export const highlightPending = (id: string) => pending.get(id);

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

const pairKey = (language: string, theme: string) =>
  `${language}\u0000${theme}`;

export function highlightReady(language: string, theme: string) {
  const key = pairKey(language, theme);
  let loading = loads.get(key);

  if (loading) return loading;

  loading = import("shiki")
    .then(({ getSingletonHighlighter }) =>
      getSingletonHighlighter({ langs: [language], themes: [theme] }),
    )
    .then((loaded) => {
      highlighter = loaded;

      pairs.add(key);
    })
    .catch((error) => {
      console.error(error);
      loads.delete(key);
    });

  loads.set(key, loading);

  return loading;
}

export function highlight(
  id: string,
  source: string,
  language: string,
  theme: string,
): Highlighted | undefined {
  const pair = pairKey(language, theme);

  if (!pairs.has(pair) || !highlighter) {
    pending.set(id, highlightReady(language, theme));

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
