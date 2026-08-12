function caretFromPoint(x: number, y: number): Range | null {
  const pos = document.caretPositionFromPoint?.(x, y);

  if (!pos) return null;

  const range = document.createRange();

  range.setStart(pos.offsetNode, pos.offset);
  range.collapse(true);

  return range;
}

export function useInlineTextEdit(
  node: () => Tree,
  element: () => HTMLElement | null,
) {
  const { getNodeComponent } = useNodeComponents();
  const { updateComponent } = useDeckStore();

  const editing = ref(false);

  const typography = () => getNodeComponent(node().id, "core.typography");

  const editable = () => !!typography();

  // A bound `content` is re-resolved every render, so an inline edit would be
  // invisible — and would quietly overwrite the literal kept as the fallback.
  const bound = () => isBound(typography()?.data, "content");

  function start(event?: MouseEvent) {
    if (!typography() || bound()) return;

    editing.value = true;

    nextTick(() => {
      const el = element();

      if (!el) return;

      el.focus();

      const selection = window.getSelection();
      if (!selection) return;

      let range = event ? caretFromPoint(event.clientX, event.clientY) : null;

      if (!range || !el.contains(range.startContainer)) {
        range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
      }

      selection.removeAllRanges();
      selection.addRange(range);
    });
  }

  function save() {
    if (!editing.value) return;

    editing.value = false;

    const component = typography();
    const el = element();

    if (!component || !el) return;

    const content = el.innerText;

    if (content !== component.data.content) {
      updateComponent({
        ...component,
        data: { ...component.data, content },
      });
    }
  }

  return { editing, editable, start, save };
}
