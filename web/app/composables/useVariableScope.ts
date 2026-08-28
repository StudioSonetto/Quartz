export function useVariableScope() {
  const deck = useDeckStore();

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

  function inheritedNames(node: Tree): Set<string> {
    const names = new Set<string>();

    for (const list of node.parent ? chainFor(node.parent) : []) {
      for (const entry of list) {
        if (entry.name) names.add(entry.name);
      }
    }

    return names;
  }

  return { chainFor, inheritedNames, scopeFor };
}
