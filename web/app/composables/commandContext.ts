import type { CommandContext } from "#shared/types";

export function buildCommandContext(): CommandContext {
  const deck = useDeckStore();
  const atelier = useAtelierStore();
  const route = useRoute();

  return {
    deck,
    atelier,
    get soleSelected() {
      return deck.soleSelected;
    },
    get selectedNodes() {
      return deck.selectedNodes;
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
