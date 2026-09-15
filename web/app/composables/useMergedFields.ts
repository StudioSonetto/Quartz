export function useMergedFields(
  components: MaybeRefOrGetter<ComponentModel[]>,
) {
  const { updateComponent } = useDeckStore();
  const { nodeTime } = usePlayhead();
  const { getStoredComponent } = useNodeComponents();
  const comps = computed(() => toValue(components));

  const sampled = computed(() =>
    comps.value.map((c) => {
      const anim = getStoredComponent(c.node, "core.animation")?.data;

      return {
        ...c,
        data: sampleTracks(anim?.tracks, nodeTime(anim), c.type, c.data),
      };
    }),
  );

  function field(path: string[]) {
    return mergedValue(sampled.value, path);
  }

  function set(path: string[], value: unknown) {
    for (const c of comps.value) {
      updateComponent({ ...c, data: setNested(c.data, path, value) });
    }
  }

  return { field, set };
}
