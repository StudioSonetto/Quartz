import type { ComponentModel } from "#shared/types";

// Read a nested key path out of a component's data, tolerant of nulls.
function at(data: any, path: string[]): any {
  return path.reduce((v, k) => (v == null ? v : v[k]), data);
}

// Equality that stays cheap for the scalar fields these panels mostly edit
// (strings, numbers), only paying for a JSON compare when both sides are
// objects.
function sameValue(a: any, b: any): boolean {
  if (a === b) return true;
  if (a && b && typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

// The shared value at a key path across components, or `undefined` when they
// disagree — the merged panels render that blank.
export function mergedValue(components: ComponentModel[], path: string[]): any {
  const values = components.map((c) => at(c.data, path));
  const first = values[0];
  const mixed = values.some((v) => !sameValue(v, first));
  return mixed ? undefined : first;
}

// The shared value across a list, or `mixed` when the items disagree — the
// generic "blank when they differ" reduction the merged panels lean on for
// values that live outside component data (e.g. a node's own fields).
export function allEqual<T>(values: T[], mixed: T): T {
  if (!values.length) return mixed;
  const first = values[0]!;
  return values.every((v) => v === first) ? first : mixed;
}

// Clone `data` along the given key path and set the value at its end, leaving
// the original (and any untouched nested objects) unchanged. Used by the merged
// panels to write one field without mutating the stored component data in place.
export function setNested(data: any, path: string[], value: unknown): any {
  // Immutable nested set via spread — copies only the touched path and reads
  // values through the (possibly reactive/Proxy) source, so it is safe on Pinia
  // store data where structuredClone throws a DataCloneError on the Proxy.
  const [head, ...rest] = path;
  return {
    ...data,
    [head!]: rest.length ? setNested(data[head!], rest, value) : value,
  };
}
