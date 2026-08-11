// Provided by `useMergedFields`, so a panel cannot opt a row into binding and
// forget to wire the context.
export const bindContextKey: InjectionKey<ComputedRef<ComponentModel[]>> =
  Symbol("bindContext");

function bindContext() {
  return inject(
    bindContextKey,
    computed(() => [] as ComponentModel[]),
  );
}

// The expression driving `path`, or undefined when unbound — or when the
// selection disagrees, matching how the fields themselves merge.
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

  // Panels merge 1…N nodes, so binding must work on a multi-selection too. The
  // chain is read from the first node: with a selection spanning groups the
  // others may see different variables, but an empty list would be worse.
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

    const result = resolveBinding(source.value, scopeFor(node));

    return result.ok ? null : result.error;
  });

  // Refused rather than written: the spec's promise is that a mismatch never
  // reaches storage, where it would render as a broken property with no clue.
  function bind(
    expression: string,
  ): { ok: true } | { ok: false; error: string } {
    const node = scopeNode.value;

    if (expression && node) {
      const result = resolveBinding(expression, scopeFor(node));

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
