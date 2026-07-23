import { flattenTree } from "~/utils/tree";
import { normalizeTreeKey, resolveTreeKey } from "~/utils/treeKeyboard";
import { isEditableTarget } from "~/utils/dom";

export function useTreeKeyboard() {
  const deck = useDeckStore();
  const { currentTree, selectedNode } = storeToRefs(deck);
  const atelier = useAtelierStore();
  const { highlightedNodeId, collapsedNodeIds, focus } = storeToRefs(atelier);
  const { selectNode, releaseSelection } = useNodeSelection();

  // True while a pointer press is entering the tree. A click focuses the node
  // button *before* its @click selects the node, so without this the focusin
  // seed below would land on the first (root) item.
  let pointerFocus = false;

  function onPointerdown() {
    pointerFocus = true;
  }

  function onKeydown(e: KeyboardEvent) {
    // Ignore keys from the inline rename input (and any editable) so it keeps
    // native caret movement / Enter-to-commit.
    if (isEditableTarget(e.target)) return;
    if (!currentTree.value) return;

    const key = normalizeTreeKey(e);

    if (!key) return;

    const visible = flattenTree(currentTree.value, collapsedNodeIds.value);
    const intent = resolveTreeKey(
      key,
      visible,
      highlightedNodeId.value,
      collapsedNodeIds.value,
      selectedNode.value?.id ?? null,
    );
    if (!intent) {
      // Arrows belong to the tree even where they resolve to nothing — Left on
      // the root, Right on a leaf. Claim them anyway so the global ←/→ slide
      // bindings don't fire and navigate the deck out from under the cursor.
      if (key.startsWith("Arrow")) e.preventDefault();

      return;
    }

    e.preventDefault();
    e.stopPropagation();

    switch (intent.type) {
      case "highlight":
        atelier.setHighlighted(intent.id);

        break;
      case "expand":
        atelier.setCollapsed(intent.id, false);

        break;
      case "collapse":
        atelier.setCollapsed(intent.id, true);

        break;
      case "select": {
        const node = visible.find((t) => t.id === intent.id);

        if (node) selectNode(node);

        break;
      }
      case "release":
        releaseSelection();

        break;
    }
  }

  function onFocusin() {
    const viaPointer = pointerFocus;
    pointerFocus = false;
    // A live highlight means focus is only moving between rows inside the tree,
    // so the cursor is already placed. Keyed off the highlight rather than the
    // focus region so this cannot depend on which focusin handler ran first.
    if (highlightedNodeId.value) return;
    atelier.setFocus("hierarchy");
    // Mouse entry: the node's @click selects and highlights the clicked node,
    // so don't seed the keyboard cursor onto the first (root) item.
    if (viaPointer) {
      atelier.setHighlighted(null);
      return;
    }
    if (!currentTree.value) return;
    // flattenTree always emits the root first, so the fallback is just the
    // tree root — no need to walk the tree to find it.
    atelier.setHighlighted(selectedNode.value?.id ?? currentTree.value.id);
  }

  function onFocusout(e: FocusEvent) {
    pointerFocus = false;
    // Ignore focus moves that stay inside the tree region.
    const next = e.relatedTarget as Node | null;
    if (next && (e.currentTarget as HTMLElement).contains(next)) return;
    atelier.setHighlighted(null);
    if (focus.value === "hierarchy") atelier.setFocus(null);
  }

  return { onKeydown, onFocusin, onFocusout, onPointerdown };
}
