import type { ShallowRef } from "vue";

export const nodeRectsKey: InjectionKey<ReturnType<typeof useNodeRects>> =
  Symbol("nodeRects");

export type NodeRect = Rect & {
  angle: number;
  radius: number;
  size: Size;
};

function matrixOf(style: CSSStyleDeclaration) {
  return style.transform === "none"
    ? new DOMMatrix()
    : new DOMMatrix(style.transform);
}

function orientation(el: HTMLElement, container: HTMLElement) {
  const style = getComputedStyle(el);

  let m = matrixOf(style);

  for (let n = el.parentElement; n && n !== container; n = n.parentElement)
    m = matrixOf(getComputedStyle(n)).multiply(m);

  const scale = Math.hypot(m.a, m.b) || 1;

  return {
    angle: (Math.atan2(m.b, m.a) * 180) / Math.PI,
    radius: (parseFloat(style.borderTopLeftRadius) || 0) * scale,
    size: {
      width: el.offsetWidth * scale,
      height: el.offsetHeight * scale,
    },
  };
}

export function useNodeRects(root: Readonly<ShallowRef<HTMLElement | null>>) {
  const { selectedNodes } = storeToRefs(useDeckStore());
  const { hoveredNodeId } = storeToRefs(useAtelierStore());

  const ids = computed(() => {
    const list = selectedNodes.value.map((n) => n.id);

    if (hoveredNodeId.value && !list.includes(hoveredNodeId.value))
      list.push(hoveredNodeId.value);

    return list;
  });

  const rects = ref(new Map<string, NodeRect>());

  function measure() {
    const container = root.value;

    if (!container) {
      rects.value = new Map();

      return;
    }

    const c = container.getBoundingClientRect();
    const next = new Map<string, NodeRect>();

    for (const id of ids.value) {
      const el = document.getElementById(id);

      if (!(el instanceof HTMLElement)) continue;

      const r = el.getBoundingClientRect();

      if (r.width === 0 && r.height === 0) continue;

      next.set(id, {
        left: r.left - c.left,
        top: r.top - c.top,
        width: r.width,
        height: r.height,
        ...orientation(el, container),
      });
    }

    rects.value = next;
  }

  let rafId = 0;

  function schedule() {
    if (rafId) return;

    rafId = requestAnimationFrame(() => {
      rafId = 0;
      measure();
    });
  }

  useMutationObserver(root, schedule, {
    subtree: true,
    attributes: true,
    attributeFilter: ["style"],
    characterData: true,
  });

  useResizeObserver(root, schedule);

  watch(ids, () => nextTick(measure));

  onMounted(() => nextTick(measure));

  onUnmounted(() => {
    if (rafId) cancelAnimationFrame(rafId);
  });

  return { rects, measure };
}
