export const BIND_KEY = "$bind";

export const BUILTIN_NAMES = [
  "slides.index",
  "slides.count",
  "deck.title",
  "date",
] as const;

export type BuiltinName = (typeof BUILTIN_NAMES)[number];

const BUILTINS = new Set<string>(BUILTIN_NAMES);

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

export function applyBindings(
  data: Record<string, any>,
  bind: Record<string, string>,
  scope: Scope,
): Record<string, any> {
  let out = data;

  for (const [path, source] of Object.entries(bind)) {
    const result = resolveSource(source, scope);

    if (!result.ok) continue;

    out = setNested(out, path.split("."), result.value);
  }

  return Object.fromEntries(
    Object.entries(out).filter(([key]) => !key.startsWith("$")),
  );
}

export function resolveData(
  data: Record<string, any>,
  scope: () => Scope,
): Record<string, any> {
  const bind = data?.[BIND_KEY];

  return bind ? applyBindings(data, bind, scope()) : data;
}

export function isBound(
  data: Record<string, any> | undefined,
  path: string,
): boolean {
  return !!data?.[BIND_KEY]?.[path];
}

export function anyBound(
  data: Record<string, any> | undefined,
  paths: readonly string[],
): boolean {
  return paths.some((path) => isBound(data, path));
}

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

export function variableProblems(
  list: VariableDef[],
  inherited: ReadonlySet<string> = new Set(),
): Map<number, string> {
  const problems = new Map<number, string>();
  const graph = new Map<string, string[]>();
  const declared = new Set(list.map((entry) => entry.name).filter(Boolean));
  const seenNames = new Set<string>();

  list.forEach((entry, index) => {
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

    if (BUILTINS.has(entry.name)) {
      problems.set(index, `"${entry.name}" is a built-in`);

      return;
    }

    const sources = holeSources(entry.expression);

    if (entry.expression.replace(HOLE, "").includes("{{")) {
      problems.set(index, "Unclosed {{");

      return;
    }

    if (!sources.length) {
      const mismatch = kindProblem(literalValue(entry.expression), entry.kind);

      if (mismatch) problems.set(index, mismatch);

      return;
    }

    const uses: string[] = [];

    for (const source of sources) {
      const ast = parse(source);

      if (isParseError(ast)) {
        problems.set(index, ast.error);
        return;
      }

      uses.push(...dependencies(ast));
    }

    const unknown = uses.find(
      (name) =>
        !declared.has(name) && !inherited.has(name) && !BUILTINS.has(name),
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

  return typeof value === "string" || typeof value === "number"
    ? null
    : "Expected text";
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
  if (isLiteral(source)) return source;

  return source.replace(
    HOLE,
    (_match, inner: string) => `{{ ${transform(inner.trim())} }}`,
  );
}

function holeSources(source: string): string[] {
  if (isLiteral(source)) return [];

  return [...source.matchAll(HOLE)].map((match) => match[1]!.trim());
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

export function renameAcross(
  components: ComponentModel[],
  from: string,
  to: string,
): ComponentModel[] {
  const changed: ComponentModel[] = [];

  for (const component of components) {
    let data = component.data;
    let dirty = false;

    const bind = data?.[BIND_KEY] as Record<string, string> | undefined;

    if (bind) {
      const next = { ...bind };
      let bound = false;

      for (const [path, source] of Object.entries(bind)) {
        if (!usesVariable(source, from)) continue;

        next[path] = renameInSource(source, from, to);
        bound = true;
      }

      if (bound) {
        data = { ...data, [BIND_KEY]: next };
        dirty = true;
      }
    }

    if (component.type === "core.base" && Array.isArray(data.variables)) {
      const current = data.variables as VariableDef[];
      const renamed = current.map((entry) =>
        entry.name !== to && usesVariable(entry.expression, from)
          ? { ...entry, expression: renameInSource(entry.expression, from, to) }
          : entry,
      );

      if (renamed.some((entry, i) => entry !== current[i])) {
        data = { ...data, variables: renamed };
        dirty = true;
      }
    }

    if (dirty) changed.push({ ...component, data });
  }

  return changed;
}

export function usesVariable(source: string, name: string): boolean {
  return holeSources(source).some((inner) => {
    const ast = parse(inner);

    return !isParseError(ast) && dependencies(ast).includes(name);
  });
}
