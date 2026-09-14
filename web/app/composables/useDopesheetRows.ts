export type DopesheetRow = {
  node: string;
  name: string;
  tracks: Track[];
  stateKeys: StateKey[];
  loop?: string;
};

export function useDopesheetRows() {
  const { animatedComponents, unlockedSelection } = storeToRefs(useDeckStore());

  return computed<DopesheetRow[]>(() =>
    unlockedSelection.value.flatMap((node) => {
      const component = animatedComponents.value.find(
        (c) => c.node === node.id,
      );

      if (!component) return [];

      return {
        node: node.id,
        name: node.name ?? "Node",
        tracks: (component.data.tracks ?? []) as Track[],
        stateKeys: (component.data.stateKeys ?? []) as StateKey[],
        loop: component.data.loop,
      };
    }),
  );
}
