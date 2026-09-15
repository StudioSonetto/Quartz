export function one(value: string | string[]): string {
  return Array.isArray(value) ? value[0]! : value;
}

export function usePaintField(
  components: () => ComponentModel[],
  field: (path: string[]) => any,
  key: string,
) {
  const raw = computed(() => field([key]));

  return {
    raw,
    mixed: computed(() => components().length > 1 && raw.value === undefined),
    paint: computed(() => coerceBackground(raw.value)),
  };
}
