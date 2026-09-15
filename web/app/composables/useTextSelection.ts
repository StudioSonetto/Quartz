function offsetOf(el: HTMLElement, container: Node, offset: number): number {
  const range = document.createRange();

  range.selectNodeContents(el);
  range.setEnd(container, offset);

  return range.toString().length;
}

function rangeIn(el: HTMLElement, start: number, end: number): Range | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();

  let at = 0;
  let started = false;

  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const length = (node.nodeValue ?? "").length;

    if (!started && start < at + length) {
      range.setStart(node, start - at);
      started = true;
    }

    if (started && end <= at + length) {
      range.setEnd(node, end - at);

      return range;
    }

    at += length;
  }

  return null;
}

export function useTextSelection() {
  const { textSelection, editingNodeId } = storeToRefs(useAtelierStore());
  const { soleSelected } = storeToRefs(useDeckStore());
  const { getNodeComponent } = useNodeComponents();

  function track() {
    const id = editingNodeId.value;
    const el = id ? document.getElementById(id) : null;
    const native = window.getSelection();

    if (!el || !native || native.rangeCount === 0) return;

    const range = native.getRangeAt(0);

    if (!el.contains(range.commonAncestorContainer)) return;

    if (native.isCollapsed) {
      textSelection.value = null;

      return;
    }

    const a = offsetOf(el, range.startContainer, range.startOffset);
    const b = offsetOf(el, range.endContainer, range.endOffset);

    textSelection.value =
      a === b
        ? null
        : { nodeId: id!, start: Math.min(a, b), end: Math.max(a, b) };
  }

  function painted(): Range | null {
    const active = textSelection.value;

    if (!active) return null;
    if (active.nodeId === editingNodeId.value) return null;
    if (active.nodeId !== soleSelected.value?.id) return null;

    const el = document.getElementById(active.nodeId);

    return el ? rangeIn(el, active.start, active.end) : null;
  }

  function paint() {
    if (!window.CSS?.highlights) return;

    const range = painted();

    if (range) CSS.highlights.set("quartz-text", new Highlight(range));
    else CSS.highlights.delete("quartz-text");
  }

  useEventListener(document, "selectionchange", track);

  watch(
    [
      textSelection,
      editingNodeId,
      soleSelected,
      () =>
        textSelection.value &&
        getNodeComponent(textSelection.value.nodeId, "core.typography")?.data
          .content,
    ],
    paint,
    { flush: "post" },
  );
}
