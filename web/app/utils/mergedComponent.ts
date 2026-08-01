import type { ComponentModel, ComponentType } from "#shared/types";

export function commonComponentTypes(
  componentsByNode: ComponentModel[][],
): ComponentType[] {
  if (!componentsByNode.length) return [];
  const first = componentsByNode[0]!;
  const rest = componentsByNode.slice(1);
  return first
    .map((c) => c.type)
    .filter((type) => rest.every((list) => list.some((c) => c.type === type)));
}

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

export function mergedValue(
  components: ComponentModel[],
  path: string[],
): { value: any; mixed: boolean } {
  const values = components.map((c) => at(c.data, path));
  const first = values[0];
  const mixed = values.some((v) => !sameValue(v, first));
  return { value: mixed ? undefined : first, mixed };
}
