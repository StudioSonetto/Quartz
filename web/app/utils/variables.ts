export const BIND_KEY = "$bind";

// `chain` is nearest-first: index 0 is the node's own variables, the last entry
// is the slide root. First match wins, which is what makes a group shadow root.
export function buildScope(
  chain: VariableDef[][],
  builtins: Record<string, Value>,
): Scope {
  return {
    variable(name) {
      for (const level of chain) {
        const found = level.find((entry) => entry.name === name);
        if (found) return found;
      }

      return undefined;
    },
    // Own keys only: a plain object inherits `toString`, `constructor` and
    // friends, which would otherwise resolve as built-ins holding functions.
    builtin: (name) =>
      Object.hasOwn(builtins, name) ? builtins[name] : undefined,
  };
}

// Write the `$bind` map back, dropping it entirely when it empties — an empty
// map is truthy, so leaving one behind would cost every later render a scope
// build to resolve nothing.
export function writeBind(
  data: Record<string, any>,
  path: string,
  expression: string,
): Record<string, any> {
  const next = { ...(data?.[BIND_KEY] ?? {}) };

  if (expression) next[path] = expression;
  else delete next[path];

  return Object.keys(next).length
    ? setNested(data, [BIND_KEY], next)
    : Object.fromEntries(Object.entries(data).filter(([k]) => k !== BIND_KEY));
}

function evaluateSource(
  source: string,
  scope: Scope,
): { ok: true; value: Value } | { ok: false; error: string } {
  const ast = parse(source);
  if (isParseError(ast)) return { ok: false, error: ast.error };

  const value = evaluate(ast, scope);
  if (isEvalError(value)) return { ok: false, error: value.error };

  return { ok: true, value };
}

const HOLE = /\{\{([^}]*)\}\}/g;

export function resolveBinding(
  source: string,
  scope: Scope,
): { ok: true; value: Value } | { ok: false; error: string } {
  if (!source.includes("{{")) return evaluateSource(source, scope);

  let out = "";
  let cursor = 0;

  for (const match of source.matchAll(HOLE)) {
    const result = evaluateSource(match[1]!.trim(), scope);
    if (!result.ok) return result;

    out += source.slice(cursor, match.index) + String(result.value);
    cursor = match.index + match[0].length;
  }

  const tail = source.slice(cursor);

  // An unclosed hole would otherwise render its own braces onto the slide.
  if (tail.includes("{{")) return { ok: false, error: "Unclosed {{" };

  return { ok: true, value: out + tail };
}

export function applyBindings(
  data: Record<string, any>,
  bind: Record<string, string>,
  scope: Scope,
): Record<string, any> {
  let out = data;

  for (const [path, source] of Object.entries(bind)) {
    const result = resolveBinding(source, scope);

    // A failed binding leaves the stored literal, so the canvas keeps rendering.
    if (!result.ok) continue;

    out = setNested(out, path.split("."), result.value);
  }

  // Renderers never see reserved keys, by construction rather than convention —
  // that includes the WebGL layer, which lives in another repo.
  return Object.fromEntries(
    Object.entries(out).filter(([key]) => !key.startsWith("$")),
  );
}
