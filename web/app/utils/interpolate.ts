const HEX = /^#[0-9a-f]{6}$/i;

function blendHex(from: string, to: string, t: number): string {
  let out = "#";

  for (let i = 1; i < 7; i += 2) {
    const a = parseInt(from.slice(i, i + 2), 16);
    const b = parseInt(to.slice(i, i + 2), 16);

    out += Math.round(a + (b - a) * t)
      .toString(16)
      .padStart(2, "0");
  }

  return out;
}

export function blendData(
  from: Record<string, any>,
  to: Record<string, any>,
  t: number,
): Record<string, any> {
  const out: Record<string, any> = { ...from };

  for (const key of Object.keys(to)) {
    const a = from?.[key];
    const b = to[key];

    if (typeof a === "number" && typeof b === "number") {
      out[key] = a + (b - a) * t;
    } else if (typeof a === "string" && HEX.test(a) && HEX.test(b ?? "")) {
      out[key] = blendHex(a, b, t);
    } else if (isPlainObject(a) && isPlainObject(b)) {
      out[key] = blendData(a, b, t);
    } else {
      out[key] = t < 0.5 ? a : b;
    }
  }

  return out;
}
