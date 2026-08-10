export const ASSET_MIME = "application/x-quartz-asset";

const CASCADE = 24;

const dragging = ref<{ name: string; kind: AssetKind } | null>(null);

const FILE_PREVIEW = { mode: "file" } as const;

const preview = shallowRef<
  | {
      mode: "node";
      label: string;
      icon: string;
      left: number;
      top: number;
      width: number | null;
      height: number | null;
    }
  | { mode: "file" }
  | null
>(null);

export function useAssetDrag() {
  const deck = useDeckStore();
  const { currentTree } = storeToRefs(deck);
  const { canvasSize } = storeToRefs(useAtelierStore());
  const { findRenderEl } = useCanvasScale();
  const assets = useAssetsStore();
  const { getNodeComponent } = useNodeComponents();

  function start(name: string) {
    const kind = assetKind(name);

    dragging.value = kind ? { name, kind } : null;
  }

  function end() {
    dragging.value = null;
    preview.value = null;
  }

  function nodeUnderPoint(x: number, y: number): Tree | null {
    const root = currentTree.value;

    if (!root) return null;

    const bySlideId = new Map(flattenTree(root).map((n) => [n.id, n]));

    for (const el of document.elementsFromPoint(x, y)) {
      const node = bySlideId.get((el as HTMLElement).id);

      if (node) return node;
    }

    return root;
  }

  function plan(event: DragEvent) {
    const asset = dragging.value;
    const rect = findRenderEl()?.getBoundingClientRect();

    if (!asset || !rect) return null;

    const hit = resolveDropTarget(
      nodeUnderPoint(event.clientX, event.clientY),
      asset.kind,
    );

    if (!hit) return null;

    const size = defaultNodeSize(hit.def.type);
    const position = dropPosition(
      { x: event.clientX, y: event.clientY },
      rect,
      canvasSize.value,
      size,
    );

    return { asset, hit, size, position, rect };
  }

  function over(event: DragEvent) {
    const transfer = event.dataTransfer;

    if (!transfer) return;

    if (hasFiles(event)) {
      event.preventDefault();

      transfer.dropEffect = "copy";
      preview.value = FILE_PREVIEW;

      return;
    }

    if (!transfer.types.includes(ASSET_MIME)) return;

    event.preventDefault();

    const p = plan(event);

    if (!p) {
      transfer.dropEffect = "none";
      preview.value = null;

      return;
    }

    transfer.dropEffect = "copy";

    const toPx = {
      x: p.rect.width / canvasSize.value.width,
      y: p.rect.height / canvasSize.value.height,
    };

    preview.value = {
      mode: "node",
      label: p.hit.def.label,
      icon: p.hit.def.icon,
      left: p.position.x * toPx.x,
      top: p.position.y * toPx.y,
      width: p.size ? p.size.width * toPx.x : null,
      height: p.size ? p.size.height * toPx.y : null,
    };
  }

  function leave(event: DragEvent) {
    const related = event.relatedTarget as Node | null;

    if (related && findRenderEl()?.contains(related)) return;

    preview.value = null;
  }

  async function dropFiles(event: DragEvent) {
    event.preventDefault();

    const files = Array.from(event.dataTransfer?.files ?? []);
    const rect = findRenderEl()?.getBoundingClientRect();
    const point = { x: event.clientX, y: event.clientY };
    const deckId = deck.currentSlides?.deck;
    const target = nodeUnderPoint(point.x, point.y);

    end();

    if (!rect || !deckId) return;

    const planned = files.flatMap((file) => {
      const kind = assetKind(file.name);

      return kind ? [{ file, kind }] : [];
    });

    if (!planned.length) return;

    const drops: {
      file: File;
      id: string;
      def: NodeTypeDef;
      at: { x: number; y: number };
    }[] = [];
    let from = target;

    planned.forEach(({ file, kind }, i) => {
      const hit = resolveDropTarget(from, kind);

      if (!hit) return;

      const at = { x: point.x + i * CASCADE, y: point.y + i * CASCADE };
      const position = dropPosition(
        at,
        rect,
        canvasSize.value,
        defaultNodeSize(hit.def.type),
      );

      const id = deck.createNode(hit.def.label, hit.def.type, {
        parentId: hit.parent.id,
        position,
        seed: true,
      });

      if (!id) return;

      from = deck.getNodeAsTree(id) ?? from;

      drops.push({ file, id, def: hit.def, at });
    });

    const uploaded = await assets
      .uploadAssets(
        deckId,
        planned.map((p) => p.file),
      )
      .catch((error) => {
        console.error(error);

        return new Map<File, string | null>();
      });

    const failed = drops.filter((d) => !uploaded.get(d.file));
    const created = drops.filter((d) => uploaded.get(d.file));

    deck.deleteNodes(failed.flatMap((d) => deck.getNodeAsTree(d.id) ?? []));

    await Promise.all(
      created.map(async (d) => {
        await d.def.asset!.apply(d.id, uploaded.get(d.file)!);

        recentre(d.id, d.at, rect);
      }),
    );

    deck.selectNodes(created.map((d) => d.id));
  }

  async function drop(event: DragEvent) {
    const types = event.dataTransfer?.types;

    if (!types) return;

    if (hasFiles(event)) return dropFiles(event);
    if (!types.includes(ASSET_MIME)) return;

    event.preventDefault();

    const p = plan(event);
    const point = { x: event.clientX, y: event.clientY };

    end();

    if (!p) return;

    const id = deck.createNode(p.hit.def.label, p.hit.def.type, {
      parentId: p.hit.parent.id,
      position: p.position,
      seed: true,
    });

    if (!id) return;

    await p.hit.def.asset!.apply(id, p.asset.name);

    recentre(id, point, p.rect);

    deck.selectedNodeIds = [id];
    deck.anchorId = id;
  }

  function recentre(
    id: string,
    point: { x: number; y: number },
    rect: DOMRect,
  ) {
    const transform = getNodeComponent(id, "core.transform");

    if (!transform) return;

    const { width, height } = transform.data.size;

    if (typeof width !== "number" || typeof height !== "number") return;

    const settled = dropPosition(point, rect, canvasSize.value, {
      width,
      height,
    });

    if (
      settled.x === transform.data.position.x &&
      settled.y === transform.data.position.y
    )
      return;

    transform.data.position = { ...transform.data.position, ...settled };

    deck.updateComponent(transform);
  }

  return { preview, start, end, leave, over, drop };
}
