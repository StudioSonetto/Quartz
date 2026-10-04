import { FONTSHARE_CSS, fonts } from "~~/shared/utils/fonts";

const CATALOGUE: ReadonlySet<string> = new Set<string>(fonts);

const served = reactive(new Map<string, boolean>());

function fontshareCssUrl(family: string): string {
  const base = inDiscordActivity() ? "/api/discord/fonts" : FONTSHARE_CSS;

  return `${base}?f[]=${fontSlug(family)}&display=swap`;
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

export function fontWeights(family: string): [number, number][] | null {
  if (!import.meta.client || (CATALOGUE.has(family) && !served.get(family)))
    return null;

  const ranges: [number, number][] = [];

  for (const face of document.fonts) {
    if (face.family.replace(/["']/g, "") !== family) continue;
    if (face.style !== "normal") continue;
    if (face.weight === "normal") return null;

    const [min, max = min] = face.weight.split(" ").map(Number);

    ranges.push([min!, max!]);
  }

  return ranges.length ? ranges : null;
}

export function ensureFonts(
  families: readonly (string | null | undefined)[],
): void {
  if (!import.meta.client) return;

  for (const family of families) {
    if (!family || !CATALOGUE.has(family) || served.has(family)) continue;

    served.set(family, false);

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href = fontshareCssUrl(family);
    link.onload = () => served.set(family, true);
    link.onerror = () => served.delete(family);

    document.head.appendChild(link);
  }
}
