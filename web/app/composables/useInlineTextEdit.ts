import type { Run } from "~/modules/core/components/typography/types";

function caretFromPoint(x: number, y: number): Range | null {
  const pos = document.caretPositionFromPoint?.(x, y);

  if (!pos) return null;

  const range = document.createRange();

  range.setStart(pos.offsetNode, pos.offset);
  range.collapse(true);

  return range;
}

function caretAtEnd(el: HTMLElement): Range {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();

  let last: Node | null = null;

  while (walker.nextNode()) last = walker.currentNode;

  if (last) range.setStart(last, (last.nodeValue ?? "").length);
  else range.selectNodeContents(el);

  range.collapse(true);

  return range;
}

function readRuns(el: HTMLElement, runs: Run[]): Run[] {
  const walker = document.createTreeWalker(
    el,
    NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
  );
  const out: Run[] = [];
  let trailingBr = false;

  for (let cursor = walker.nextNode(); cursor; cursor = walker.nextNode()) {
    const br = cursor.nodeName === "BR";

    if (cursor.nodeType === Node.ELEMENT_NODE && !br) continue;

    const text = br ? "\n" : (cursor.nodeValue ?? "");

    if (!text) continue;

    const owner = cursor.parentElement?.closest("[data-run]");
    const marks = owner
      ? runs[Number(owner.getAttribute("data-run"))]?.marks
      : undefined;

    out.push(marks ? { text, marks: { ...marks } } : { text });
    trailingBr = br;
  }

  if (trailingBr) out.pop();

  return mergeRuns(out);
}

export function useInlineTextEdit(
  node: () => Tree,
  element: () => HTMLElement | null,
) {
  const { getNodeComponent } = useNodeComponents();
  const { updateComponent } = useDeckStore();
  const atelier = useAtelierStore();

  const editing = computed(() => atelier.editingNodeId === node().id);

  onScopeDispose(() => {
    if (atelier.editingNodeId === node().id) atelier.editingNodeId = null;
  });

  const typography = () => getNodeComponent(node().id, "core.typography");

  const editable = () => !!typography();

  const bound = () => isBound(typography()?.data, "content");

  function start(event?: MouseEvent) {
    if (!typography() || bound()) return;

    atelier.editingNodeId = node().id;

    nextTick(() => {
      const el = element();

      if (!el) return;

      el.focus();

      const selection = window.getSelection();
      if (!selection) return;

      let range = event ? caretFromPoint(event.clientX, event.clientY) : null;

      if (!range || !el.contains(range.startContainer)) range = caretAtEnd(el);

      selection.removeAllRanges();
      selection.addRange(range);
    });
  }

  function keydown(event: KeyboardEvent) {
    if (!editing.value) return;

    if (["mod+b", "mod+i", "mod+u"].includes(eventToCombo(event))) {
      event.preventDefault();
    } else if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      document.execCommand("insertText", false, "\n");
    }
  }

  function insert(event: ClipboardEvent | DragEvent) {
    if (!editing.value) return;

    event.preventDefault();

    const source =
      "clipboardData" in event ? event.clipboardData : event.dataTransfer;
    const text = source?.getData("text/plain");

    if (text) document.execCommand("insertText", false, text);
  }

  function save() {
    if (!editing.value) return;

    atelier.editingNodeId = null;

    window.getSelection()?.removeAllRanges();

    const component = typography();
    const el = element();

    if (!component || !el) return;

    const runs = readRuns(el, toRuns(component.data.content));

    const content = fromRuns(runs);

    if (!deepEqual(content, component.data.content)) {
      updateComponent({
        ...component,
        data: { ...component.data, content },
      });
    }
  }

  return { editing, editable, start, save, keydown, insert };
}
