export function useVariableScope() {
  const deck = useDeckStore();

  // Nearest first, so the node's own variables shadow its ancestors'.
  function chainFor(node: Tree): VariableDef[][] {
    const chain: VariableDef[][] = [];

    for (
      let current: Tree | undefined = node;
      current;
      current = current.parent
    ) {
      const variables = deck.variablesByNode.get(current.id);

      if (variables) chain.push(variables);
    }

    return chain;
  }

  function scopeFor(node: Tree): Scope {
    return buildScope(chainFor(node), deck.builtins);
  }

  return { chainFor, scopeFor };
}
