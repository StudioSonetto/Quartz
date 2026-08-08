// Pure serialisation of a `core.layout` component into CSS. No store access and
// no asset lookup — callers resolve an image name to a URL and pass it in, which
// keeps this unit-testable and usable from both a node renderer and the slide
// container.

export type BackgroundFit = "cover" | "contain" | "tile" | "fill";

export type Background =
  | { type: "none" }
  | { type: "colour"; value: string }
  | { type: "image"; value: string; fit: BackgroundFit };

const NONE: Background = { type: "none" };

export function coerceBackground(background: unknown): Background {
  if (typeof background === "string") {
    return background === "" || background === "transparent"
      ? NONE
      : { type: "colour", value: background };
  }

  if (background && typeof background === "object") {
    const bg = background as Record<string, any>;

    if (bg.type === "colour") {
      return { type: "colour", value: bg.value ?? "" };
    }

    if (bg.type === "image") {
      return {
        type: "image",
        value: bg.value ?? "",
        fit: (bg.fit as BackgroundFit) ?? "cover",
      };
    }
  }

  return NONE;
}

export function backgroundStyle(
  background: unknown,
  resolveUrl?: (name: string) => string | undefined,
): Record<string, string> {
  const bg = coerceBackground(background);

  if (bg.type === "none") return {};

  if (bg.type === "colour") return { backgroundColor: bg.value };

  const imageUrl = bg.value ? resolveUrl?.(bg.value) : undefined;

  if (!imageUrl) return {};

  if (bg.fit === "tile") {
    return {
      backgroundImage: `url("${imageUrl}")`,
      backgroundRepeat: "repeat",
    };
  }

  return {
    backgroundImage: `url("${imageUrl}")`,
    backgroundSize: bg.fit === "fill" ? "100% 100%" : bg.fit,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
  };
}

export function gridStyle(layout: Record<string, any>): Record<string, string> {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${layout.columns}, max-content)`,
    gap: `${layout.gap}px`,
    padding: `${layout.padding}px`,
    alignItems: layout.align,
  };
}
