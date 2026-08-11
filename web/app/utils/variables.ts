export const BIND_KEY = "$bind";

export const BUILTIN_NAMES = [
  "slides.index",
  "slides.count",
  "deck.title",
  "date",
] as const;

export type BuiltinName = (typeof BUILTIN_NAMES)[number];

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
    builtin: (name) =>
      Object.hasOwn(builtins, name) ? builtins[name] : undefined,
  };
}

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

// Reachability over the declared names only. A cycle would otherwise be caught
// per-render by the evaluator's visited set — silently, and invisibly.
function reaches(
  from: string,
  target: string,
  graph: Map<string, string[]>,
  seen = new Set<string>(),
): boolean {
  if (seen.has(from)) return false;

  seen.add(from);

  for (const next of graph.get(from) ?? []) {
    if (next === target || reaches(next, target, graph, seen)) return true;
  }

  return false;
}

export function variableProblems(list: VariableDef[]): Map<number, string> {
  const problems = new Map<number, string>();
  const graph = new Map<string, string[]>();
  const declared = new Set(list.map((entry) => entry.name).filter(Boolean));
  const seenNames = new Set<string>();

  list.forEach((entry, index) => {
    // A freshly added row is blank; that is not yet a mistake.
    if (!entry.name && !entry.expression) return;

    if (!entry.name) {
      problems.set(index, "Needs a name");
      return;
    }

    if (seenNames.has(entry.name)) {
      problems.set(index, `Duplicate name "${entry.name}"`);
      return;
    }

    seenNames.add(entry.name);

    if ((BUILTIN_NAMES as readonly string[]).includes(entry.name)) {
      problems.set(index, `"${entry.name}" is a built-in`);
      return;
    }

    const ast = parse(entry.expression);

    if (isParseError(ast)) {
      problems.set(index, ast.error);
      return;
    }

    const uses = dependencies(ast);
    const unknown = uses.find(
      (name) =>
        !declared.has(name) &&
        !(BUILTIN_NAMES as readonly string[]).includes(name),
    );

    if (unknown) {
      problems.set(index, `Unknown variable "${unknown}"`);
      return;
    }

    graph.set(entry.name, uses);
  });

  list.forEach((entry, index) => {
    if (problems.has(index) || !entry.name) return;

    if (reaches(entry.name, entry.name, graph)) {
      problems.set(index, `Cycle through "${entry.name}"`);
    }
  });

  return problems;
}

export function kindProblem(
  value: Value,
  kind: VariableKind | undefined,
): string | null {
  if (!kind) return null;

  if (kind === "number") {
    return typeof value === "number" ? null : "Expected a number";
  }

  if (kind === "colour") {
    return typeof value === "string" && value.startsWith("#")
      ? null
      : "Expected a colour";
  }

  return typeof value === "string" ? null : "Expected text";
}

function printAst(ast: Ast, rename: (name: string) => string): string {
  switch (ast.kind) {
    case "number":
      return String(ast.value);
    case "string":
      return `'${ast.value}'`;
    case "colour":
      return ast.value;
    case "name":
      return rename(ast.value);
    case "unary":
      return `-${printAst(ast.operand, rename)}`;
    case "binary":
      return `(${printAst(ast.left, rename)} ${ast.op} ${printAst(ast.right, rename)})`;
    case "ternary":
      return `(${printAst(ast.test, rename)} ? ${printAst(ast.then, rename)} : ${printAst(ast.otherwise, rename)})`;
  }
}

function overHoles(
  source: string,
  transform: (inner: string) => string,
): string {
  if (!source.includes("{{")) return transform(source);

  return source.replace(
    HOLE,
    (_match, inner: string) => `{{ ${transform(inner.trim())} }}`,
  );
}

export function renameInSource(
  source: string,
  from: string,
  to: string,
): string {
  return overHoles(source, (inner) => {
    const ast = parse(inner);

    if (isParseError(ast)) return inner;

    return printAst(ast, (name) => (name === from ? to : name));
  });
}

export function usesVariable(source: string, name: string): boolean {
  let found = false;

  overHoles(source, (inner) => {
    const ast = parse(inner);

    if (!isParseError(ast) && dependencies(ast).includes(name)) found = true;

    return inner;
  });

  return found;
}
