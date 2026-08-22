export interface ComponentListContext {
  selected: Ref<number | null>;
  open: Ref<Set<number>>;
  select: (index: number) => void;
  toggle: (index: number) => void;
}

const componentListKey: InjectionKey<ComponentListContext> =
  Symbol("componentList");

export function provideComponentList(context: ComponentListContext) {
  provide(componentListKey, context);
}

export function useComponentList() {
  return inject(componentListKey, undefined);
}
