export const BASE_STATE = "";

const STATELESS: ComponentType[] = ["core.animation", "core.base"];

export function isStateless(type: ComponentType) {
  return STATELESS.includes(type);
}

export function overridesFor(
  animData: any,
  state: string,
  type: ComponentType,
): Record<string, any> | undefined {
  if (!state) return undefined;

  return animData?.states?.[state]?.overrides?.[type];
}

export function applyState(
  base: Record<string, any>,
  override: Record<string, any> | undefined,
): Record<string, any> {
  return override ? deepMerge(base, override) : base;
}
