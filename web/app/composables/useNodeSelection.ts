export const marqueeKey: InjectionKey<{ begin?: (event: MouseEvent) => void }> =
  Symbol("marquee");

export const pathToolKey: InjectionKey<{
  press?: (event: PointerEvent) => void;
}> = Symbol("pathTool");

export function useNodeSelection() {
  const deck = useDeckStore();
  const { selectedNodeIds, anchorId, currentTree } = storeToRefs(deck);
  const atelier = useAtelierStore();

  function commitFocus(soleId: string | null) {
    atelier.setHighlighted(soleId);

    if (soleId) {
      atelier.setFocus("properties");
      focusProperties();
    }
  }

  function select(node: Tree, { handOffFocus = true } = {}) {
    if (deck.soleSelected?.id === node.id) return;

    selectedNodeIds.value = [node.id];
    anchorId.value = node.id;

    if (handOffFocus) commitFocus(node.id);
    else atelier.setHighlighted(node.id);
  }

  function toggle(node: Tree) {
    const ids = selectedNodeIds.value;

    selectedNodeIds.value = ids.includes(node.id)
      ? ids.filter((id) => id !== node.id)
      : [...ids, node.id];

    anchorId.value = node.id;

    commitFocus(deck.soleSelected?.id ?? null);
  }

  function range(node: Tree) {
    if (!currentTree.value) return;

    const anchor = deck.anchorId;

    if (!anchor) return select(node);

    const order = flattenTree(currentTree.value).map((n) => n.id);
    const ids = rangeIds(order, anchor, node.id);

    selectedNodeIds.value = ids.length ? ids : [node.id];

    commitFocus(deck.soleSelected?.id ?? null);
  }

  function extendSelection(nodes: Tree[]) {
    const add = unlockedOnly(nodes).map((n) => n.id);

    selectedNodeIds.value = [...new Set([...selectedNodeIds.value, ...add])];

    commitFocus(deck.soleSelected?.id ?? null);
  }

  function selectFromEvent(node: Tree, event: MouseEvent): boolean {
    if (atelier.activeTool !== "select") return false;
    if (isNodeLocked(node)) return false;

    event.stopPropagation();
    if (event.shiftKey || event.metaKey || event.ctrlKey) {
      if (event.type === "mousedown") toggle(node);

      return true;
    }
    select(node);

    return true;
  }

  function clear() {
    selectedNodeIds.value = [];
    anchorId.value = null;
    atelier.setHighlighted(null);
    atelier.setFocus(null);

    (document.activeElement as HTMLElement | null)?.blur();
  }

  return { select, toggle, range, extendSelection, selectFromEvent, clear };
}
