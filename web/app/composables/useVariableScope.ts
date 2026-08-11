// One value per session. A deck left open across midnight shows the stale date
// until reload, which is cheaper than re-reading the clock per render.
const TODAY = new Date().toISOString().slice(0, 10);

export function useVariableScope() {
  const { variablesByNode, slides, deckTitle, currentSlidesIndex } =
    storeToRefs(useDeckStore());

  // The renderer only ever draws `currentTree`, so the slide being rendered is
  // always the current one — resolving each node's own slide would mean walking
  // every tree per render.
  // Typed against `BUILTIN_NAMES` so the editor's shadowing warning cannot drift
  // out of step with what actually resolves.
  const builtins = computed<Record<BuiltinName, Value>>(() => ({
    "slides.index": currentSlidesIndex.value,
    "slides.count": slides.value.length,
    "deck.title": deckTitle.value,
    date: TODAY,
  }));

  // Nearest first, so the node's own variables shadow its ancestors'.
  function chainFor(node: Tree): VariableDef[][] {
    const chain: VariableDef[][] = [];

    for (
      let current: Tree | undefined = node;
      current;
      current = current.parent
    ) {
      const variables = variablesByNode.value.get(current.id);

      if (variables) chain.push(variables);
    }

    return chain;
  }

  function scopeFor(node: Tree): Scope {
    return buildScope(chainFor(node), builtins.value);
  }

  return { chainFor, scopeFor };
}
