<template>
  <div v-if="active" data-html2canvas-ignore class="path-overlay">
    <template v-for="view in [overlay()]" :key="0">
      <svg v-if="view.preview" class="path-preview">
        <path :d="view.preview" />
      </svg>
      <template v-for="placed in view.points" :key="placed.index">
        <div
          v-for="arm in placed.arms"
          :key="`line-${arm.key}`"
          class="path-arm-line"
          :style="arm.line"
        ></div>
        <div
          v-for="arm in placed.arms"
          :key="arm.key"
          class="path-arm-handle"
          :style="arm.handle"
          @pointerdown.stop.prevent="
            startArmDrag(placed.index, arm.key, $event)
          "
        ></div>
        <div
          class="path-point"
          :class="{
            'path-point-selected': placed.selected,
            'path-point-close': placed.closing,
          }"
          :style="placed.style"
          @pointerdown.stop.prevent="onPointPress(placed.index, $event)"
          @dblclick.stop.prevent="
            activeTool === 'point' && cycleMode(placed.index)
          "
        ></div>
      </template>
    </template>
  </div>
</template>

<style scoped lang="postcss">
.path-overlay {
  @apply absolute inset-0 z-50 pointer-events-none;
}

.path-point {
  @apply absolute w-2.5 h-2.5 bg-light-200 outline outline-1 outline-accent;
  @apply pointer-events-auto -translate-x-1/2 -translate-y-1/2 cursor-pointer;
}

.path-point-selected {
  @apply bg-accent;
}

.path-point-close {
  @apply w-3.5 h-3.5 bg-accent outline-2;
}

.path-preview {
  @apply absolute inset-0 w-full h-full overflow-visible;
  @apply pointer-events-none text-accent;

  path {
    fill: none;
    stroke: currentColor;
    stroke-width: 1;
    stroke-dasharray: 4 3;
  }
}

.path-arm-handle {
  @apply absolute w-2 h-2 rounded-full bg-light-200 outline outline-1 outline-accent;
  @apply pointer-events-auto -translate-x-1/2 -translate-y-1/2 cursor-pointer;
}

.path-arm-line {
  @apply absolute h-px bg-accent/60;

  transform-origin: 0 50%;
}
</style>

<script setup lang="ts">
const deck = useDeckStore();
const { soleSelected } = storeToRefs(deck);
const { updateComponent } = deck;

const atelier = useAtelierStore();
const { activeTool, selectedPoints } = storeToRefs(atelier);

const { getNodeComponent, renderData } = useNodeComponents();
const { renderRoot, scale } = useCanvasScale();

const active = computed(() => isNodeEditing(soleSelected.value));

const workingPoints = ref<Point[] | null>(null);

const clonePoints = (list: Point[] = points.value) =>
  list.map((p) => ({ ...p }));

const storedPoints = computed<Point[]>(() => {
  const node = soleSelected.value;

  if (!node) return [];

  return (
    (getNodeComponent(node.id, "core.path")?.data.points as
      | Point[]
      | undefined) ?? []
  );
});

const points = computed(() => workingPoints.value ?? storedPoints.value);

function drawnTransform(node: Tree) {
  return renderData(node, "core.transform") as {
    position: { x: number; y: number; z: number };
    size: { width: number; height: number };
    rotation: number;
    scale: number;
  };
}

function rotate(dx: number, dy: number, degrees: number) {
  if (!degrees) return { x: dx, y: dy };

  const radians = (degrees * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  return { x: dx * cos - dy * sin, y: dx * sin + dy * cos };
}

function frame() {
  const node = soleSelected.value;
  const el = node && document.getElementById(node.id);
  const rect = el?.getBoundingClientRect();
  const container = renderRoot.value?.getBoundingClientRect();

  if (!node || !rect || !container) return null;

  const drawn = drawnTransform(node);

  return { rect, container, drawn, u: drawn.scale || 1, s: scale() };
}

type Frame = NonNullable<ReturnType<typeof frame>>;

// getBoundingClientRect returns the ROTATED bounding box, whose centre is
// still the true rotation centre — so rotate around that, not the AABB size.
function toLocal(event: PointerEvent, f = frame()) {
  if (!f) return null;

  const { rect, drawn, u, s } = f;

  const p = rotate(
    ((event.clientX - (rect.left + rect.width / 2)) * s.x) / u,
    ((event.clientY - (rect.top + rect.height / 2)) * s.y) / u,
    -(drawn.rotation ?? 0),
  );

  return {
    x: p.x + (drawn.size.width ?? 0) / 2,
    y: p.y + (drawn.size.height ?? 0) / 2,
  };
}

function toScreen(point: { x: number; y: number }, f: Frame) {
  const { rect, container, drawn, u, s } = f;

  const p = rotate(
    point.x - (drawn.size.width ?? 0) / 2,
    point.y - (drawn.size.height ?? 0) / 2,
    drawn.rotation ?? 0,
  );

  return {
    x: rect.left - container.left + rect.width / 2 + (p.x * u) / s.x,
    y: rect.top - container.top + rect.height / 2 + (p.y * u) / s.y,
  };
}

function screenStyle(pos: { x: number; y: number }) {
  return { left: `${pos.x}px`, top: `${pos.y}px` };
}

function armLineStyle(
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;

  return {
    left: `${a.x}px`,
    top: `${a.y}px`,
    width: `${Math.hypot(dx, dy)}px`,
    transform: `rotate(${(Math.atan2(dy, dx) * 180) / Math.PI}deg)`,
  };
}

const CLOSE_PX = 8;

const cursor = ref<{ x: number; y: number } | null>(null);

const drawing = computed(
  () => active.value && activeTool.value === "pen" && !!atelier.editingShapeId,
);

useEventListener(window, "pointermove", (event: PointerEvent) => {
  cursor.value = drawing.value ? { x: event.clientX, y: event.clientY } : null;
});

watch(drawing, (on) => {
  if (!on) cursor.value = null;
});

const toContainer = (client: { x: number; y: number }, f: Frame) => ({
  x: client.x - f.container.left,
  y: client.y - f.container.top,
});

const near = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y) <= CLOSE_PX;

const ARMS = ["in", "out"] as const;

// The cursor sits on the point being dragged, so a preview would double the arm.
function previewPath(f: Frame, to: { x: number; y: number }) {
  const last = points.value[points.value.length - 1];

  if (workingPoints.value || !last) return null;

  const from = toScreen(last, f);

  if (!last.out) return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;

  const c1 = toScreen({ x: last.x + last.out.x, y: last.y + last.out.y }, f);

  return `M ${from.x} ${from.y} C ${c1.x} ${c1.y} ${to.x} ${to.y} ${to.x} ${to.y}`;
}

// A plain function, not a computed: it must re-measure on every render, and a
// cached value would survive a canvas resize that invalidates every rect.
//
// Every reactive read happens BEFORE the frame check. On the render right after
// the pen creates a node its element does not exist yet, and returning early
// would leave that pass depending on nothing — no later edit would re-run it.
function overlay() {
  const list = points.value;
  const selection = selectedPoints.value;
  const client = drawing.value ? cursor.value : null;

  const f = frame();

  if (!f) return { preview: null, points: [] };

  const at = client && toContainer(client, f);

  return {
    preview: at ? previewPath(f, at) : null,
    points: list.map((point, index) => {
      const selected = selection.has(index);
      const screen = toScreen(point, f);

      return {
        index,
        selected,
        closing: index === 0 && !!at && list.length >= 2 && near(at, screen),
        style: screenStyle(screen),
        arms: ARMS.flatMap((key) => {
          const offset = selected ? point[key] : undefined;

          if (!offset) return [];

          const arm = toScreen(
            { x: point.x + offset.x, y: point.y + offset.y },
            f,
          );

          return [
            { key, handle: screenStyle(arm), line: armLineStyle(screen, arm) },
          ];
        }),
      };
    }),
  };
}

function dragDelta(ev: PointerEvent, origin: { x: number; y: number }) {
  const now = toLocal(ev);

  if (!now) return null;

  const dx = now.x - origin.x;
  const dy = now.y - origin.y;

  return ev.shiftKey ? constrain(dx, dy) : { dx, dy };
}

function constrain(dx: number, dy: number) {
  if (!dx && !dy) return { dx, dy };

  const len = Math.hypot(dx, dy);
  const step = Math.PI / 4;
  const angle = Math.round(Math.atan2(dy, dx) / step) * step;

  return { dx: Math.cos(angle) * len, dy: Math.sin(angle) * len };
}

const history = useHistoryStore();
const { start } = usePointerDrag();

function commitPoints(next: Point[], label: string) {
  const node = soleSelected.value;

  if (!node) return;

  const path = getNodeComponent(node.id, "core.path");
  const transform = getNodeComponent(node.id, "core.transform");

  if (!path || !transform) return;

  const end = history.begin(label);

  const { points: refit, dx, dy } = refitPoints(next);
  const bounds = pathBounds(refit);

  path.data.points = refit;
  updateComponent(path);

  transform.data.position.x += dx;
  transform.data.position.y += dy;
  // A zero-extent viewBox disables SVG rendering, and a straight line has one.
  transform.data.size = {
    width: Math.max(1, bounds.width),
    height: Math.max(1, bounds.height),
  };
  updateComponent(transform);

  end();
}

function commitWorking(label: string) {
  if (workingPoints.value) commitPoints(workingPoints.value, label);

  workingPoints.value = null;
}

function toCanvas(event: PointerEvent) {
  const rect = renderRoot.value?.getBoundingClientRect();

  if (!rect) return null;

  const s = scale();

  return {
    x: (event.clientX - rect.left) * s.x,
    y: (event.clientY - rect.top) * s.y,
  };
}

function placePoint(
  origin: { x: number; y: number },
  label: string,
  onDone?: () => void,
) {
  const base = clonePoints();
  const index = base.length;

  base.push({ x: origin.x, y: origin.y, mode: "corner" });
  workingPoints.value = base;
  selectedPoints.value = new Set([index]);

  start(
    label,
    (ev) => {
      const delta = dragDelta(ev, origin);

      if (!delta) return;

      const { dx, dy } = delta;
      const dragged = Math.hypot(dx, dy) > 3;

      workingPoints.value = base.map((p, i): Point => {
        if (i !== index) return p;
        if (!dragged) return { x: p.x, y: p.y, mode: "corner" };

        return {
          x: p.x,
          y: p.y,
          mode: "mirror",
          out: { x: dx, y: dy },
          in: { x: -dx, y: -dy },
        };
      });
    },
    () => {
      const final = workingPoints.value ?? base;

      workingPoints.value = null;
      commitPoints(final, label);
      onDone?.();
    },
  );
}

function nearFirstPoint(event: PointerEvent) {
  const first = points.value[0];
  const f = frame();

  if (points.value.length < 2 || !first || !f) return false;

  return near(
    toContainer({ x: event.clientX, y: event.clientY }, f),
    toScreen(first, f),
  );
}

function closePath() {
  const id = atelier.editingShapeId;
  const path = id && getNodeComponent(id, "core.path");

  if (!path) return;

  const end = history.begin("Close path");

  updateComponent({ ...path, data: { ...path.data, closed: true } });

  end();

  atelier.setActiveTool("point");
}

function finishDrawing() {
  const id = atelier.editingShapeId;
  const node = soleSelected.value;

  atelier.editingShapeId = null;

  if (id && node?.id === id) {
    const path = getNodeComponent(id, "core.path");
    const count = ((path?.data.points as Point[] | undefined) ?? []).length;

    if (count < 2) {
      const end = history.begin("Discard path");

      deck.deleteNodes([node]);

      end();
    }
  }

  atelier.setActiveTool("select");
}

function startPath(event: PointerEvent) {
  const origin = toCanvas(event);

  if (!origin) return;

  const parentType = soleSelected.value?.type ?? "core.group";

  if (!canContain(parentType, "core.shape")) useNodeSelection().clear();

  const endCreate = history.begin("Draw path");
  const id = deck.createNode("Path", "core.shape", { position: origin });

  if (!id) {
    endCreate();

    return;
  }

  const shape = getNodeComponent(id, "core.shape");

  if (shape)
    updateComponent({
      ...shape,
      data: {
        ...shape.data,
        kind: "path",
        fill: { type: "none" },
        stroke: { type: "colour", value: shape.data.fill?.value ?? "#3B82F6" },
        strokeWidth: shape.data.strokeWidth || 1,
      },
    });

  deck.addComponent(id, "core.path");

  atelier.editingShapeId = id;

  placePoint({ x: 0, y: 0 }, "Draw path", endCreate);
}

function distToSegment(
  p: { x: number; y: number },
  a: { x: number; y: number },
  b: { x: number; y: number },
) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  if (!lengthSq) return Math.hypot(p.x - a.x, p.y - a.y);

  const t = Math.max(
    0,
    Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lengthSq),
  );

  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function insertOnSegment(event: PointerEvent) {
  const node = soleSelected.value;
  const list = points.value;

  if (!node || list.length < 2) return;

  const closed = !!getNodeComponent(node.id, "core.path")?.data.closed;
  const f = frame();

  if (!f) return;

  const screenPoint = {
    x: event.clientX - f.container.left,
    y: event.clientY - f.container.top,
  };

  const segments: { a: number; b: number; insertAt: number }[] = [];

  for (let i = 1; i < list.length; i++)
    segments.push({ a: i - 1, b: i, insertAt: i });
  if (closed)
    segments.push({ a: list.length - 1, b: 0, insertAt: list.length });

  let best: { insertAt: number; a: Point; b: Point } | null = null;
  let bestDist = Infinity;

  for (const seg of segments) {
    const a = list[seg.a]!;
    const b = list[seg.b]!;
    const dist = distToSegment(screenPoint, toScreen(a, f), toScreen(b, f));

    if (dist < bestDist) {
      bestDist = dist;
      best = { insertAt: seg.insertAt, a, b };
    }
  }

  if (!best || bestDist > CLOSE_PX) return;

  const mid: Point = {
    x: (best.a.x + best.b.x) / 2,
    y: (best.a.y + best.b.y) / 2,
    mode: "corner",
  };

  const next = clonePoints(list);

  next.splice(best.insertAt, 0, mid);

  commitPoints(next, "Insert point");
}

function handleCanvasPress(event: PointerEvent) {
  if (event.button !== 0) return;

  if (atelier.activeTool === "pen") return handlePenPress(event);
  if (atelier.activeTool === "point") return insertOnSegment(event);
}

function handlePenPress(event: PointerEvent) {
  // The node can be deleted mid-session; a stale id would block every new path.
  const editing = atelier.editingShapeId;

  if (editing && !deck.getNodeById(editing)) atelier.editingShapeId = null;

  if (!atelier.editingShapeId) return startPath(event);

  const node = soleSelected.value;

  if (!node || node.id !== atelier.editingShapeId) return;
  if (nearFirstPoint(event)) return closePath();

  const local = toLocal(event);

  if (!local) return;

  placePoint(local, "Add point");
}

const pathTool = inject(pathToolKey);

if (pathTool) pathTool.press = handleCanvasPress;

function onPointPress(i: number, e: PointerEvent) {
  if (activeTool.value === "pen") {
    if (i === 0 && atelier.editingShapeId) closePath();

    return;
  }

  startPointDrag(i, e);
}

function startPointDrag(i: number, e: PointerEvent) {
  const node = soleSelected.value;

  if (!node) return;

  if (e.shiftKey) selectedPoints.value = new Set([...selectedPoints.value, i]);
  else if (!selectedPoints.value.has(i)) selectedPoints.value = new Set([i]);

  const origin = toLocal(e);

  if (!origin) return;

  const startPoints = clonePoints();
  const selected = [...selectedPoints.value];

  start(
    "Move point",
    (ev) => {
      const delta = dragDelta(ev, origin);

      if (!delta) return;

      workingPoints.value = startPoints.map((p, idx) =>
        selected.includes(idx)
          ? { ...p, x: p.x + delta.dx, y: p.y + delta.dy }
          : p,
      );
    },
    () => commitWorking("Move point"),
  );
}

function startArmDrag(i: number, key: "in" | "out", e: PointerEvent) {
  const node = soleSelected.value;

  if (!node) return;

  const startPoints = clonePoints();
  const point = startPoints[i];

  if (!point) return;

  const breaking = e.altKey;
  const startArm = point[key] ?? { x: 0, y: 0 };
  const origin = toLocal(e);

  if (!origin) return;

  start(
    "Adjust handle",
    (ev) => {
      const delta = dragDelta(ev, origin);

      if (!delta) return;

      workingPoints.value = startPoints.map((p, idx) => {
        if (idx !== i) return p;

        const arm = { x: startArm.x + delta.dx, y: startArm.y + delta.dy };
        const mode = breaking ? "free" : p.mode;
        const updated: Point = { ...p, mode, [key]: arm };

        if (mode === "mirror") {
          const other = key === "in" ? "out" : "in";

          updated[other] = { x: -arm.x, y: -arm.y };
        }

        return updated;
      });
    },
    () => commitWorking("Adjust handle"),
  );
}

function cycleMode(i: number) {
  const node = soleSelected.value;

  if (!node) return;

  const list = clonePoints();
  const p = list[i];

  if (!p) return;

  if (p.mode !== "corner") {
    list[i] = { x: p.x, y: p.y, mode: "corner" };
  } else {
    const next = list[i + 1];
    const prev = list[i - 1];

    const out = next
      ? { x: (next.x - p.x) / 4, y: (next.y - p.y) / 4 }
      : prev
        ? { x: (p.x - prev.x) / 4, y: (p.y - prev.y) / 4 }
        : { x: 20, y: 0 };

    list[i] = { ...p, mode: "mirror", out, in: { x: -out.x, y: -out.y } };
  }

  commitPoints(list, "Change point type");
}

function deleteSelected() {
  if (!selectedPoints.value.size) return;

  const next = points.value.filter((_, i) => !selectedPoints.value.has(i));

  commitPoints(next, "Delete points");
  selectedPoints.value = new Set();
}

useEventListener(
  window,
  "keydown",
  (e: KeyboardEvent) => {
    if (!active.value) return;
    if (isInsideOpenDialog(e.target)) return;

    if (e.key === "Enter" && atelier.editingShapeId) {
      e.preventDefault();
      finishDrawing();

      return;
    }

    if (e.key === "Escape") {
      e.preventDefault();

      if (atelier.editingShapeId) finishDrawing();
      else atelier.setActiveTool("select");

      return;
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      if (isEditableTarget(e.target) || !selectedPoints.value.size) return;

      e.preventDefault();
      deleteSelected();
    }
  },
  { capture: true },
);
</script>
