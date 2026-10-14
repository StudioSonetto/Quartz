import { isPlainObject } from "~/utils/normaliseComponents";

export type JsonSchema = {
  type: "string" | "number" | "boolean" | "object" | "array" | "null";
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
};

const kindOf = (value: unknown): JsonSchema["type"] =>
  value === null
    ? "null"
    : Array.isArray(value)
      ? "array"
      : (typeof value as JsonSchema["type"]);

export function schemaOf(value: unknown): JsonSchema {
  if (Array.isArray(value) && value.length)
    return { type: "array", items: schemaOf(value[0]) };
  if (!isPlainObject(value) || !Object.keys(value).length)
    return { type: kindOf(value) };

  return {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, schemaOf(v)]),
    ),
  };
}

const mismatch = (at: string, expected: string, got: string) =>
  `${at} must be a${expected === "array" || expected === "object" ? "n" : ""} ${expected}, got ${got}`;

export function checkPatch(
  defaults: unknown,
  patch: unknown,
  path = "",
): string | null {
  if (!isPlainObject(patch))
    return path ? `${path} must be an object` : "patch must be an object";
  // A `type` key marks a union (background, fill): any shape passes.
  if (
    !isPlainObject(defaults) ||
    !Object.keys(defaults).length ||
    (path && Object.hasOwn(defaults, "type"))
  )
    return null;

  for (const [key, value] of Object.entries(patch)) {
    const at = path ? `${path}.${key}` : key;

    if (!Object.hasOwn(defaults, key)) return `unknown field ${at}`;

    const expected = kindOf(defaults[key]);
    const got = kindOf(value);

    if (expected === "null") continue;
    if (defaults[key] === "auto" && got === "number") continue;
    if (expected !== got) return mismatch(at, expected, got);

    const error =
      expected === "object"
        ? checkPatch(defaults[key], value, at)
        : checkItem(defaults[key], value, at);

    if (error) return error;
  }

  return null;
}

// Every field of the `ai.items` sample is required; null takes any value.
function checkItem(sample: unknown, value: unknown, at: string): string | null {
  const expected = kindOf(sample);
  const got = kindOf(value);

  if (expected === "null") return null;
  if (expected !== got) return mismatch(at, expected, got);
  if (Array.isArray(sample))
    return sample.length
      ? (value as unknown[]).reduce<string | null>(
          (e, v, i) => e ?? checkItem(sample[0], v, `${at}[${i}]`),
          null,
        )
      : null;
  if (!isPlainObject(sample)) return null;

  for (const [key, v] of Object.entries(sample)) {
    if (!Object.hasOwn(value as object, key)) return `${at}.${key} is missing`;

    const error = checkItem(
      v,
      (value as Record<string, unknown>)[key],
      `${at}.${key}`,
    );

    if (error) return error;
  }

  return null;
}

const UNSAFE = new Set(["__proto__", "constructor", "prototype"]);

export function mergePatch<T>(data: T, patch: unknown): T {
  if (!isPlainObject(data) || !isPlainObject(patch)) return patch as T;

  const next: Record<string, unknown> = { ...data };

  for (const [key, value] of Object.entries(patch)) {
    if (UNSAFE.has(key)) continue;

    next[key] =
      isPlainObject(value) && isPlainObject(next[key])
        ? mergePatch(next[key], value)
        : value;
  }

  return next as T;
}
