export function useMergedFields(
  components: MaybeRefOrGetter<ComponentModel[]>,
) {
  const { updateComponent } = useDeckStore();
  const comps = computed(() => toValue(components));

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
