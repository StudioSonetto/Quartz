import { focusProperties } from "~/utils/panelFocus";

// The selection lifecycle, shared by the mouse and keyboard paths so they can't
// drift: committing a node hands focus to Properties, and releasing clears the
// selection, the keyboard cursor and the focus region together.
export function useNodeSelection() {
  const { selectedNode } = storeToRefs(useDeckStore());
  const atelier = useAtelierStore();

  // `handOffFocus: false` selects without moving focus — used when the click
  // landed on the inline rename input, which must keep the caret.
  function selectNode(node: Tree, { handOffFocus = true } = {}) {
    selectedNode.value = node;
    atelier.setHighlighted(node.id);

    if (!handOffFocus) return;

    atelier.setFocus("properties");
    focusProperties();
  }

  function releaseSelection() {
    selectedNode.value = null;
    atelier.setHighlighted(null);
    atelier.setFocus(null);

    (document.activeElement as HTMLElement | null)?.blur();
  }

  return { selectNode, releaseSelection };
}
