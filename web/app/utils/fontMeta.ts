export type FontMeta = { family: string; weight: string; style: string };

const WEIGHT_NAMES: Record<string, number> = {
  hairline: 100,
  thin: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  regular: 400,
  book: 400,
  normal: 400,
  roman: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  heavy: 800,
  black: 900,
};

const spaced = (name: string) =>
  name
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();

export function fontFromName(fileName: string): FontMeta {
  const stem = assetStem(fileName);
  const words = spaced(stem).split(" ");

  for (const n of [3, 2, 1]) {
    if (words.length <= n) continue;

    const tail = words.slice(-n).join("").toLowerCase();
    const italic = /(italic|oblique)$/.test(tail);
    const weight = tail.replace(/(italic|oblique)$/, "");

    if (Object.hasOwn(WEIGHT_NAMES, weight) || (italic && !weight))
      return {
        family: words.slice(0, -n).join(" "),
        weight: String(WEIGHT_NAMES[weight] ?? 400),
        style: italic ? "italic" : "normal",
      };
  }

  return { family: spaced(stem) || stem, weight: "normal", style: "normal" };
}

// TTF, OTF and WOFF. WOFF2 needs Brotli, which browsers can't decompress.
export async function readFontMeta(
  buffer: ArrayBuffer,
): Promise<FontMeta | null> {
  try {
    const tables = await fontTables(buffer);
    const os2 = tables.get("OS/2");
    const name = tables.get("name");
    const family = name && (nameRecord(name, 16) ?? nameRecord(name, 1));

    if (!os2 || !family) return null;

    const weight = os2.getUint16(4);

    return {
      family,
      weight:
        weightRange(tables.get("fvar")) ??
        (weight
          ? String(Math.min(weight < 10 ? weight * 100 : weight, 1000))
          : "normal"),
      style: os2.getUint16(62) & 1 ? "italic" : "normal",
    };
  } catch {
    return null;
  }
}

const SFNT = [0x00010000, 0x4f54544f, 0x74727565];
const WOFF = 0x774f4646;

async function fontTables(buffer: ArrayBuffer) {
  const view = new DataView(buffer);
  const magic = view.getUint32(0);
  const woff = magic === WOFF;
  const tables = new Map<string, DataView>();

  if (!woff && !SFNT.includes(magic)) return tables;

  const count = view.getUint16(woff ? 12 : 4);

  for (let i = 0; i < count; i++) {
    const at = woff ? 44 + i * 20 : 12 + i * 16;
    const tag = String.fromCharCode(...new Uint8Array(buffer, at, 4));

    if (tag !== "OS/2" && tag !== "name" && tag !== "fvar") continue;

    const offset = view.getUint32(at + (woff ? 4 : 8));
    const length = view.getUint32(at + (woff ? 8 : 12));
    const bytes = new Uint8Array(buffer, offset, length);
    const data =
      woff && length < view.getUint32(at + 12) ? await inflate(bytes) : bytes;

    tables.set(tag, new DataView(data.buffer, data.byteOffset, data.length));
  }

  return tables;
}

function weightRange(fvar?: DataView): string | undefined {
  if (!fvar) return;

  for (let i = 0; i < fvar.getUint16(8); i++) {
    const at = fvar.getUint16(4) + i * fvar.getUint16(10);

    if (fvar.getUint32(at) === 0x77676874)
      return `${fvar.getInt32(at + 4) / 65536} ${fvar.getInt32(at + 12) / 65536}`;
  }
}

async function inflate(bytes: Uint8Array<ArrayBuffer>) {
  const stream = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"));

  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function nameRecord(view: DataView, id: number): string | undefined {
  const strings = view.getUint16(4);
  let fallback: string | undefined;

  for (let i = 0; i < view.getUint16(2); i++) {
    const at = 6 + i * 12;

    if (view.getUint16(at + 6) !== id) continue;

    const platform = view.getUint16(at);
    const bytes = new Uint8Array(
      view.buffer,
      view.byteOffset + strings + view.getUint16(at + 10),
      view.getUint16(at + 8),
    );

    if (platform === 0 || platform === 3) {
      const text = new TextDecoder("utf-16be").decode(bytes);

      if (platform === 3 && view.getUint16(at + 4) === 0x409) return text;

      fallback ??= text;
    } else if (platform === 1) {
      fallback ??= String.fromCharCode(...bytes);
    }
  }

  return fallback;
}
