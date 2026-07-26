import { getNodeType, getComponentType } from "~/modules/registry";
import { ROOT_PATH } from "~/utils/nodePath";

function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function deepMerge(
  base: Record<string, any>,
  override: Record<string, any>,
): Record<string, any> {
  const out: Record<string, any> = { ...base };
  for (const key of Object.keys(override)) {
    const b = base[key];
    const o = override[key];
    out[key] = isPlainObject(b) && isPlainObject(o) ? deepMerge(b, o) : o;
  }
  return out;
}

export function entryType(e: DefaultComponent): ComponentType {
  return typeof e === "string" ? e : e.type;
}

export function effectiveDefaults(
  nodeType: NodeType,
  componentType: ComponentType,
): Record<string, any> {
  const base = getComponentType(componentType)?.defaultData() ?? {};
  const entry = getNodeType(nodeType)?.defaultComponents.find(
    (e) => entryType(e) === componentType,
  );
  const override = typeof entry === "string" || !entry ? {} : entry.data;
  return deepMerge(base, override);
}

export function normaliseComponents(
  nodes: NodeModel[],
  components: ComponentModel[],
): {
  components: ComponentModel[];
  enqueue: { node: string; type: ComponentType }[];
} {
  const result: ComponentModel[] = [];
  const enqueue: { node: string; type: ComponentType }[] = [];

  for (const node of nodes) {
    let kept = components.filter((c) => c.node === node.id);

    // The root node is a bare container; nothing spatial applies to it.
    if (node.path === ROOT_PATH) {
      result.push(...kept);
      continue;
    }

    const def = getNodeType(node.type);
    if (!def) {
      result.push(...kept);
      continue;
    }

    // --- The one explicit structural migration: legacy webgl.object ---
    if (node.type === "webgl.object") {
      const model = kept.find((c) => c.type === "webgl.model");
      const hasTransform = kept.some((c) => c.type === "webgl.transform");
      if (model && !hasTransform && model.data?.x !== undefined) {
        const { x, y, z, scale, ...rest } = model.data;
        model.data = rest;
        kept.push({
          node: node.id,
          type: "webgl.transform",
          data: {
            position: { x: x ?? 0, y: y ?? 0, z: z ?? 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: scale ?? 1,
          },
        } as ComponentModel);
        enqueue.push({ node: node.id, type: "webgl.transform" });
        enqueue.push({ node: node.id, type: "webgl.model" });
      }
      // Retire the dead core.transform row: exclude it from the working set.
      // (Left as a harmless DB orphan — no component-delete infra for one row.)
      kept = kept.filter((c) => c.type !== "core.transform");
    }

    const guaranteed = def.defaultComponents.map(entryType);

    // Guaranteed components first: merge over effective defaults, or synthesise.
    for (const type of guaranteed) {
      const eff = effectiveDefaults(node.type, type);
      const existing = kept.find((c) => c.type === type);
      if (existing) {
        existing.data = deepMerge(eff, existing.data);
        result.push(existing);
      } else {
        result.push({ node: node.id, type, data: eff } as ComponentModel);
      }
    }

    // Preserve any remaining present components (e.g. optional `animation`),
    // merged over their own type defaults when the type is known.
    for (const c of kept) {
      if (guaranteed.includes(c.type)) continue;
      c.data = deepMerge(effectiveDefaults(node.type, c.type), c.data);
      result.push(c);
    }
  }

  return { components: result, enqueue };
}
