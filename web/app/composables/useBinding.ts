export const bindContextKey: InjectionKey<ComputedRef<ComponentModel[]>> =
  Symbol("bindContext");

function bindContext() {
  return inject(
    bindContextKey,
    computed(() => [] as ComponentModel[]),
  );
}

export function useBoundSource(path: () => string | undefined) {
  const components = bindContext();

  const source = computed<string | undefined>(() => {
    const key = path();

    return key ? mergedValue(components.value, [BIND_KEY, key]) : undefined;
  });

  return { components, source };
}

export function useBinding(
  path: () => string,
  kind: () => VariableKind | undefined,
) {
  const { components, source } = useBoundSource(path);
  const { updateComponent } = useDeckStore();
  const { selectedNodes } = storeToRefs(useDeckStore());
  const { chainFor, scopeFor } = useVariableScope();

  const scopeNode = computed(() => selectedNodes.value[0] ?? null);

  const candidates = computed<VariableDef[]>(() => {
    const node = scopeNode.value;
    const wanted = kind();

    if (!node) return [];

    const seen = new Map<string, VariableDef>();

    for (const level of chainFor(node)) {
      for (const entry of level) {
        if (!entry.name || seen.has(entry.name)) continue;
        if (wanted && entry.kind !== wanted) continue;

        seen.set(entry.name, entry);
      }
    }

    return [...seen.values()];
  });

  const error = computed(() => {
    const node = scopeNode.value;

    if (!source.value || !node) return null;

    const result = resolveSource(source.value, scopeFor(node));

    if (!result.ok) return result.error;

    // Stored sources predate the current kind, and nothing re-checks them: a
    // mismatch reaches the property as text and renders as a broken value.
    return kindProblem(result.value, kind());
  });

  function bind(
    expression: string,
  ): { ok: true } | { ok: false; error: string } {
    const node = scopeNode.value;

    if (expression && node) {
      const result = resolveSource(expression, scopeFor(node));

      if (!result.ok) return result;

      const problem = kindProblem(result.value, kind());

      if (problem) return { ok: false, error: problem };
    }

    for (const component of components.value) {
      updateComponent({
        ...component,
        data: writeBind(component.data, path(), expression),
      });
    }

    return { ok: true };
  }

  return { source, candidates, error, bind };
}
