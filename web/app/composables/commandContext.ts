import type { CommandContext } from "#shared/types";

export function buildCommandContext(): CommandContext {
  const deck = useDeckStore();
  const atelier = useAtelierStore();
  const route = useRoute();

  return {
    deck,
    atelier,
    get selectedNode() {
      return deck.selectedNode;
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
