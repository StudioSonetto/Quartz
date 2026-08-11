import { mergedValue, setNested } from "~/utils/mergedComponent";

export function useMergedFields(
  components: MaybeRefOrGetter<ComponentModel[]>,
) {
  const { updateComponent } = useDeckStore();
  const comps = computed(() => toValue(components));

  // Bindable rows read `$bind` from here. Providing it alongside the fields a
  // panel already merges means a panel cannot opt a row into binding and forget
  // to pass the components separately.
  provide(bindContextKey, comps);

  function field(path: string[]) {
    return mergedValue(comps.value, path);
  }

  function set(path: string[], value: unknown) {
    for (const c of comps.value) {
      updateComponent({ ...c, data: setNested(c.data, path, value) });
    }
  }

  return { field, set };
}
