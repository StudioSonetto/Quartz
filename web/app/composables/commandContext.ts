import type { CommandContext, Tree } from "#shared/types";

export function buildCommandContext(): CommandContext {
  const deck = useDeckStore();
  const atelier = useAtelierStore();
  const history = useHistoryStore();
  const route = useRoute();

  let alignable: Tree[] | undefined;

  return {
    deck,
    atelier,
    history,
    get soleSelected() {
      return deck.soleSelected;
    },
    get selectedNodes() {
      return deck.selectedNodes;
    },
    get unlockedNodes() {
      return deck.unlockedSelection;
    },
    get alignableNodes() {
      return (alignable ??= alignableNodes(deck.selectedNodes));
    },
    get selectedNodeIds() {
      return deck.selectedNodeIds;
    },
    get activeTab() {
      return atelier.activeTab;
    },
    get focus() {
      return atelier.focus;
    },
    get deckId() {
      return (route.params.id as string) ?? null;
    },
  };
}
