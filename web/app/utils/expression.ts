export type BinaryOp =
  | "+"
  | "-"
  | "*"
  | "/"
  | "=="
  | "!="
  | "<"
  | ">"
  | "<="
  | ">=";

export type Ast =
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "colour"; value: string }
  | { kind: "name"; value: string }
  | { kind: "unary"; op: "-"; operand: Ast }
  | { kind: "binary"; op: BinaryOp; left: Ast; right: Ast }
  | { kind: "ternary"; test: Ast; then: Ast; otherwise: Ast };

export interface ParseError {
  error: string;
  position: number;
}

export function isParseError(v: Ast | ParseError): v is ParseError {
  return "error" in v;
}

interface Token {
  type: "number" | "string" | "colour" | "name" | "op";
  value: string;
  position: number;
}

const OPERATORS = [
  "==",
  "!=",
  "<=",
  ">=",
  "+",
  "-",
  "*",
  "/",
  "<",
  ">",
  "?",
  ":",
  "(",
  ")",
];

class ParseFailure extends Error {
  constructor(
    message: string,
    readonly position: number,
  ) {
    super(message);
  }
}

function tokenise(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < source.length) {
    const char = source[i]!;

    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // `#` starts nothing else in this grammar, so a hex colour is unambiguous.
    if (char === "#") {
      const match = /^#[0-9a-fA-F]{3,8}/.exec(source.slice(i));

      if (!match || ![4, 7, 9].includes(match[0].length)) {
        throw new ParseFailure("Invalid colour", i);
      }

      tokens.push({ type: "colour", value: match[0], position: i });
      i += match[0].length;
      continue;
    }

    if (char === "'" || char === '"') {
      const end = source.indexOf(char, i + 1);

      if (end === -1) throw new ParseFailure("Unterminated string", i);

      tokens.push({
        type: "string",
        value: source.slice(i + 1, end),
        position: i,
      });
      i = end + 1;
      continue;
    }

    if (/[0-9]/.test(char)) {
      const match = /^[0-9]+(\.[0-9]+)?/.exec(source.slice(i))!;

      tokens.push({ type: "number", value: match[0], position: i });
      i += match[0].length;
      continue;
    }

    // Dots bind into the name: `brand.primary` is one identifier.
    if (/[A-Za-z_]/.test(char)) {
      const match = /^[A-Za-z_][A-Za-z0-9_]*(\.[A-Za-z_][A-Za-z0-9_]*)*/.exec(
        source.slice(i),
      )!;

      tokens.push({ type: "name", value: match[0], position: i });
      i += match[0].length;
      continue;
    }

    const op = OPERATORS.find((o) => source.startsWith(o, i));

    if (!op) throw new ParseFailure(`Unexpected character "${char}"`, i);

    tokens.push({ type: "op", value: op, position: i });
    i += op.length;
  }

  return tokens;
}

const BINARY_PRECEDENCE: Record<string, number> = {
  "==": 1,
  "!=": 1,
  "<": 1,
  ">": 1,
  "<=": 1,
  ">=": 1,
  "+": 2,
  "-": 2,
  "*": 3,
  "/": 3,
};

class Parser {
  private index = 0;

  constructor(
    private readonly tokens: Token[],
    private readonly length: number,
  ) {}

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private next(): Token {
    const token = this.tokens[this.index];

    if (!token) {
      throw new ParseFailure("Unexpected end of expression", this.length);
    }

    this.index++;
    return token;
  }

  private expect(value: string): void {
    const token = this.next();

    if (token.type !== "op" || token.value !== value) {
      throw new ParseFailure(`Expected "${value}"`, token.position);
    }
  }

  parseExpression(): Ast {
    const test = this.parseBinary(0);
    const token = this.peek();

    if (token?.type === "op" && token.value === "?") {
      this.next();

      const then = this.parseExpression();
      this.expect(":");

      return { kind: "ternary", test, then, otherwise: this.parseExpression() };
    }

    return test;
  }

  private parseBinary(minPrecedence: number): Ast {
    let left = this.parseUnary();

    for (;;) {
      const token = this.peek();
      if (token?.type !== "op") break;

      const precedence = BINARY_PRECEDENCE[token.value];
      if (precedence === undefined || precedence < minPrecedence) break;

      this.next();

      left = {
        kind: "binary",
        op: token.value as BinaryOp,
        left,
        right: this.parseBinary(precedence + 1),
      };
    }

    return left;
  }

  private parseUnary(): Ast {
    const token = this.peek();

    if (token?.type === "op" && token.value === "-") {
      this.next();

      return { kind: "unary", op: "-", operand: this.parseUnary() };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): Ast {
    const token = this.next();

    if (token.type === "number") {
      return { kind: "number", value: Number(token.value) };
    }
    if (token.type === "string") return { kind: "string", value: token.value };
    if (token.type === "colour") return { kind: "colour", value: token.value };
    if (token.type === "name") return { kind: "name", value: token.value };

    if (token.value === "(") {
      const inner = this.parseExpression();
      this.expect(")");

      return inner;
    }

    throw new ParseFailure(`Unexpected "${token.value}"`, token.position);
  }

  atEnd(): boolean {
    return this.index >= this.tokens.length;
  }

  positionHere(): number {
    return this.peek()?.position ?? this.length;
  }
}

// Bindings are re-resolved every render, and a deck holds a small fixed set of
// expression strings — parsing each one once per session is the whole win.
const PARSED = new Map<string, Ast | ParseError>();

export function parse(source: string): Ast | ParseError {
  const cached = PARSED.get(source);

  if (cached) return cached;

  const result = parseSource(source);

  PARSED.set(source, result);

  return result;
}

function parseSource(source: string): Ast | ParseError {
  try {
    const parser = new Parser(tokenise(source), source.length);
    const ast = parser.parseExpression();

    // Without this a trailing operator parses its prefix and reports success.
    if (!parser.atEnd()) {
      throw new ParseFailure(
        "Unexpected trailing input",
        parser.positionHere(),
      );
    }

    return ast;
  } catch (failure) {
    if (failure instanceof ParseFailure) {
      return { error: failure.message, position: failure.position };
    }

    throw failure;
  }
}

export type Value = string | number | boolean;

export type VariableKind = "colour" | "number" | "string" | "font";

export interface VariableDef {
  name: string;
  kind: VariableKind;
  expression: string;
}

export interface Scope {
  variable(name: string): VariableDef | undefined;
  builtin(name: string): Value | undefined;
}

export interface EvalError {
  error: string;
}

function isEvalError(v: Value | EvalError): v is EvalError {
  return typeof v === "object" && v !== null && "error" in v;
}

function binary(op: BinaryOp, left: Value, right: Value): Value | EvalError {
  switch (op) {
    case "+":
      // A string on either side concatenates, so templates need no second operator.
      if (typeof left === "string" || typeof right === "string") {
        return `${left}${right}`;
      }
      return Number(left) + Number(right);
    case "-":
      return Number(left) - Number(right);
    case "*":
      return Number(left) * Number(right);
    case "/":
      if (Number(right) === 0) return { error: "Division by zero" };
      return Number(left) / Number(right);
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case "<":
      return Number(left) < Number(right);
    case ">":
      return Number(left) > Number(right);
    case "<=":
      return Number(left) <= Number(right);
    case ">=":
      return Number(left) >= Number(right);
  }
}

export function evaluate(
  ast: Ast,
  scope: Scope,
  seen: Set<string> = new Set(),
): Value | EvalError {
  switch (ast.kind) {
    case "number":
    case "string":
    case "colour":
      return ast.value;

    case "name": {
      // Built-ins are checked first and so cannot be shadowed — a user variable
      // named `slides.index` must not silently break numbering deck-wide.
      const builtin = scope.builtin(ast.value);
      if (builtin !== undefined) return builtin;

      const variable = scope.variable(ast.value);
      if (!variable) return { error: `Unknown variable "${ast.value}"` };

      if (seen.has(ast.value)) {
        return { error: `Cycle through "${ast.value}"` };
      }

      const inner = resolveSource(
        variable.expression,
        scope,
        new Set(seen).add(ast.value),
      );

      return inner.ok ? inner.value : { error: inner.error };
    }

    case "unary": {
      const operand = evaluate(ast.operand, scope, seen);

      return isEvalError(operand) ? operand : -Number(operand);
    }

    case "binary": {
      const left = evaluate(ast.left, scope, seen);
      if (isEvalError(left)) return left;

      const right = evaluate(ast.right, scope, seen);
      if (isEvalError(right)) return right;

      return binary(ast.op, left, right);
    }

    case "ternary": {
      const test = evaluate(ast.test, scope, seen);
      if (isEvalError(test)) return test;

      return evaluate(test ? ast.then : ast.otherwise, scope, seen);
    }
  }
}

export function dependencies(ast: Ast): string[] {
  const names = new Set<string>();

  const walk = (node: Ast): void => {
    switch (node.kind) {
      case "name":
        names.add(node.value);
        return;
      case "unary":
        return walk(node.operand);
      case "binary":
        walk(node.left);
        return walk(node.right);
      case "ternary":
        walk(node.test);
        walk(node.then);
        return walk(node.otherwise);
      default:
        return;
    }
  };

  walk(ast);

  return [...names];
}

export const HOLE = /\{\{([^}]*)\}\}/g;

const SOLO_HOLE = /^\{\{([^}]*)\}\}$/;

export type Resolved =
  | { ok: true; value: Value }
  | { ok: false; error: string };

// The one place that decides what a hole looks like. Everything downstream —
// the resolver, rename, the panel's colour picker — asks rather than re-tests.
export function isLiteral(source: string): boolean {
  return !source.includes("{{");
}

export function hole(expression: string): string {
  return `{{ ${expression} }}`;
}

// Text with no holes is a value, not a formula: `Satoshi` is a font name and
// `theme.primary` is eleven characters until someone braces it.
export function literalValue(source: string): Value {
  const trimmed = source.trim();

  return trimmed !== "" && Number.isFinite(Number(trimmed))
    ? Number(trimmed)
    : source;
}

function evaluateHole(
  source: string,
  scope: Scope,
  seen: Set<string>,
): Resolved {
  const ast = parse(source);
  if (isParseError(ast)) return { ok: false, error: ast.error };

  const value = evaluate(ast, scope, seen);
  if (isEvalError(value)) return { ok: false, error: value.error };

  return { ok: true, value };
}

export function resolveSource(
  source: string,
  scope: Scope,
  seen: Set<string> = new Set(),
): Resolved {
  if (isLiteral(source)) return { ok: true, value: literalValue(source) };

  const solo = SOLO_HOLE.exec(source.trim());

  // A source that is nothing but one hole keeps the value's type; without this
  // every number-kind binding resolves to a string.
  if (solo) return evaluateHole(solo[1]!.trim(), scope, seen);

  let out = "";
  let cursor = 0;

  for (const match of source.matchAll(HOLE)) {
    const result = evaluateHole(match[1]!.trim(), scope, seen);
    if (!result.ok) return result;

    out += source.slice(cursor, match.index) + String(result.value);
    cursor = match.index + match[0].length;
  }

  const tail = source.slice(cursor);

  // An unclosed hole would otherwise render its own braces onto the slide.
  if (tail.includes("{{")) return { ok: false, error: "Unclosed {{" };

  return { ok: true, value: out + tail };
}
