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

const ROOT_COMPONENTS: ComponentType[] = ["core.base", "core.layout"];

const ROOT_LAYOUT_DEFAULTS = {
  background: { type: "colour", value: "#FAFAFA" },
};

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

    if (node.path === ROOT_PATH) {
      for (const type of ROOT_COMPONENTS) {
        const eff =
          type === "core.layout"
            ? deepMerge(
                effectiveDefaults("core.group", type),
                ROOT_LAYOUT_DEFAULTS,
              )
            : effectiveDefaults("core.group", type);

        const existing = kept.find((c) => c.type === type);

        if (existing) {
          existing.data = deepMerge(eff, existing.data);
          result.push(existing);
        } else {
          result.push({ node: node.id, type, data: eff } as ComponentModel);
        }
      }

      for (const c of kept) {
        if (ROOT_COMPONENTS.includes(c.type) || c.type === "core.transform")
          continue;

        c.data = deepMerge(effectiveDefaults("core.group", c.type), c.data);
        result.push(c);
      }

      continue;
    }

    const def = getNodeType(node.type);

    if (!def) {
      result.push(...kept);

      continue;
    }

    const guaranteed = def.defaultComponents.map(entryType);

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
