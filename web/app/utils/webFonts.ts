import { FONTSHARE_CSS, fonts } from "~~/shared/utils/fonts";

const CATALOGUE: ReadonlySet<string> = new Set<string>(fonts);

const served = new Set<string>();

function unservedFonts(
  families: readonly (string | null | undefined)[],
  alreadyServed: ReadonlySet<string>,
): string[] {
  return [...new Set(families)].filter(
    (family): family is string =>
      !!family && CATALOGUE.has(family) && !alreadyServed.has(family),
  );
}

function fontshareCssUrl(families: readonly string[]): string {
  const query = families.map((f) => `f[]=${fontSlug(f)}@1`).join("&");

  const base = inDiscordActivity() ? "/api/discord/fonts" : FONTSHARE_CSS;

  return `${base}?${query}&display=swap`;
}

export function fontsInComponents(
  components: readonly ComponentModel[],
): string[] {
  const fields = components.flatMap(
    (component) =>
      getComponentType(component.type)?.fonts?.(component.data) ?? [],
  );

  return [...new Set(fields)].filter(
    (font): font is string => typeof font === "string" && !!font,
  );
}

export function ensureFonts(
  families: readonly (string | null | undefined)[],
): void {
  if (!import.meta.client) return;

  const pending = unservedFonts(families, served);

  if (!pending.length) return;

  for (const family of pending) served.add(family);

  const link = document.createElement("link");

  link.rel = "stylesheet";
  link.href = fontshareCssUrl(pending);

  link.onerror = () => {
    for (const family of pending) served.delete(family);
  };

  document.head.appendChild(link);
}
