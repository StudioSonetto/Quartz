const HEX = /^#[0-9a-f]{6}$/i;

function blendHex(from: string, to: string, t: number): string {
  let out = "#";

  for (let i = 1; i < 7; i += 2) {
    const a = parseInt(from.slice(i, i + 2), 16);
    const b = parseInt(to.slice(i, i + 2), 16);

    // Spring and back easings overshoots.
    out += Math.min(255, Math.max(0, Math.round(a + (b - a) * t)))
      .toString(16)
      .padStart(2, "0");
  }

  return out;
}

export function blendValue(a: any, b: any, t: number): any {
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * t;
  if (typeof a === "string" && HEX.test(a) && HEX.test(b ?? ""))
    return blendHex(a, b, t);
  if (isPlainObject(a) && isPlainObject(b)) return blendData(a, b, t);

  return t < 0.5 ? a : b;
}

export function blendData(
  from: Record<string, any>,
  to: Record<string, any>,
  t: number,
): Record<string, any> {
  const out: Record<string, any> = { ...from };

  for (const key of Object.keys(to))
    out[key] = blendValue(from?.[key], to[key], t);

  return out;
}
