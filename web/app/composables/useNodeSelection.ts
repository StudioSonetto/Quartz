import { focusProperties } from "~/utils/panelFocus";
import { flattenTree } from "~/utils/tree";
import { rangeIds } from "~/utils/selection";

// The selection lifecycle, the single mutation path for the ordered selection
// id list (mouse, keyboard and palette all funnel through here so they cannot
// drift). The last id in the list is the range anchor. Root IS selectable (its
// destructive/spatial ops — delete, resize handles, group/duplicate/align —
// guard it independently), so no mutator excludes it; bulk consumers (marquee
// hit-test, select-all) drop root themselves where it doesn't belong.
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

  // Replace the selection with a single node. `handOffFocus: false` keeps the
  // caret (used when the click landed on the inline rename input).
  function select(node: Tree, { handOffFocus = true } = {}) {
    // Already the sole selection — don't re-commit or re-steal focus. A click
    // fires mousedown+click (both wired to select), and re-selecting a node the
    // user has already picked shouldn't yank focus back to Properties.
    if (deck.soleSelected?.id === node.id) return;
    selectedNodeIds.value = [node.id];
    anchorId.value = node.id;
    if (handOffFocus) commitFocus(node.id);
    else atelier.setHighlighted(node.id);
  }

  // Add or remove one node (cmd/ctrl-click). The clicked node becomes the new
  // range anchor (whether it was added or removed), matching native explorers
  // where a subsequent shift-click extends from the last cmd/ctrl-clicked item.
  // Toggling to a single survivor hands off focus; otherwise focus stays on the
  // canvas.
  function toggle(node: Tree) {
    const ids = selectedNodeIds.value;
    selectedNodeIds.value = ids.includes(node.id)
      ? ids.filter((id) => id !== node.id)
      : [...ids, node.id];
    anchorId.value = node.id;
    commitFocus(deck.soleSelected?.id ?? null);
  }

  // Shift-click / shift-arrow: select the inclusive range between the fixed
  // anchor and `node`, over the flattened visible order. The anchor is NOT
  // moved here — every shift-click re-extends from the same origin, so
  // shift-clicking a, then b, then c yields a..c (not b..c).
  function range(node: Tree) {
    if (!currentTree.value) return;
    const anchor = deck.anchorId;
    if (!anchor) return select(node);
    const order = flattenTree(currentTree.value).map((n) => n.id);
    const ids = rangeIds(order, anchor, node.id);
    selectedNodeIds.value = ids.length ? ids : [node.id];
    commitFocus(deck.soleSelected?.id ?? null);
  }

  // Marquee / select-all: union `nodes` into the selection. Callers decide
  // whether root belongs in the set they pass.
  function extendSelection(nodes: Tree[]) {
    const add = nodes.map((n) => n.id);
    selectedNodeIds.value = [...new Set([...selectedNodeIds.value, ...add])];
    commitFocus(deck.soleSelected?.id ?? null);
  }

  // The single place that maps a click's modifier keys to a selection action,
  // so the canvas surfaces (Element + Group) cannot drift. shift/meta/ctrl add
  // or remove; a plain click replaces. (The hierarchy uses shift for range — a
  // list concept — and keeps its own dispatch on purpose.)
  function selectFromEvent(node: Tree, event: MouseEvent) {
    event.stopPropagation();
    if (event.shiftKey || event.metaKey || event.ctrlKey) toggle(node);
    else select(node);
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
