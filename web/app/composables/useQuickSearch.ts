import { fuzzyFilter } from "~/utils/fuzzy";
import { ROOT_PATH } from "~/utils/nodePath";
import type { Tree } from "#shared/types";

export function useQuickSearch() {
  const deck = useDeckStore();

  function nodeResults(query: string): Tree[] {
    const nodes = deck.currentFlat().filter((n) => n.path !== ROOT_PATH);
    return fuzzyFilter(nodes, query, (n) => n.name || n.type);
  }

  function slideResults(query: string): number[] {
    const indices = deck.slides.map((_, i) => i);
    const trimmed = query.trim();
    if (/^\d+$/.test(trimmed)) {
      const idx = parseInt(trimmed, 10) - 1; // 1-based input
      return indices.filter((i) => i === idx);
    }
    return indices; // no title metadata on slides; list all
  }

  // Same routine as a click or tree Enter — sets the keyboard cursor and hands
  // focus to Properties — so picking a node from the palette lands you in the
  // same place as picking it any other way.
  const { select: selectNode } = useNodeSelection();

  function goToSlide(index: number) {
    if (index >= 0 && index < deck.slides.length) {
      deck.currentSlidesIndex = index;
    }
  }

  return { nodeResults, slideResults, selectNode, goToSlide };
}
