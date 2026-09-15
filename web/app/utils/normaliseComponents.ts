export function isPlainObject(v: unknown): v is Record<string, any> {
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

export function migrated(type: ComponentType, data: Record<string, any>) {
  return getComponentType(type)?.migrate?.(data) ?? data;
}

const ROOT_COMPONENTS: ComponentType[] = ["core.base", "core.layout"];

const ROOT_LAYOUT_DEFAULTS = {
  background: { type: "colour", value: "#FAFAFA" },
};

function relocateStates(
  nodeId: string,
  kept: ComponentModel[],
  relocated?: ComponentModel[],
) {
  const anim = kept.find((c) => c.type === "core.animation");

  if (!anim || !isPlainObject(anim.data?.states)) return;

  const { states, tracks, stateKeys, ...timing } = anim.data;

  if (!Object.keys(states).length) return;

  let base = kept.find((c) => c.type === "core.base");

  if (!base) {
    base = { node: nodeId, type: "core.base", data: {} } as ComponentModel;

    kept.push(base);
  }

  const moved = Object.fromEntries(
    Object.entries(states).map(([name, state]: [string, any]) => [
      name,
      { easing: DEFAULT_STATE_EASING, ...timing, ...state },
    ]),
  );

  base.data = {
    ...base.data,
    states: { ...moved, ...(base.data.states ?? {}) },
  };

  anim.data = { tracks: tracks ?? [], stateKeys: stateKeys ?? [] };

  relocated?.push(base, anim);
}

function relocateStateTiming(
  kept: ComponentModel[],
  relocated?: ComponentModel[],
) {
  const base = kept.find((c) => c.type === "core.base");

  if (!base || !isPlainObject(base.data?.states)) return;

  const timings = new Map<string, number>();

  const states = Object.fromEntries(
    Object.entries(base.data.states).map(([name, state]: [string, any]) => {
      const {
        duration,
        delay: _delay,
        repeat: _repeat,
        repeatType: _repeatType,
        ...rest
      } = state ?? {};

      if (typeof duration === "number") timings.set(name, duration);

      return [name, rest];
    }),
  );

  if (deepEqual(base.data.states, states)) return;

  base.data = { ...base.data, states };

  relocated?.push(base);

  const events = kept.find((c) => c.type === "core.event");

  if (!timings.size || !Array.isArray(events?.data?.handlers)) return;

  const handlers = events.data.handlers.map((handler: any) =>
    handler.duration === undefined &&
    (handler.action === "setState" || handler.action === "toggleState") &&
    timings.has(handler.state)
      ? { ...handler, duration: timings.get(handler.state) }
      : handler,
  );

  if (deepEqual(handlers, events.data.handlers)) return;

  events.data = { ...events.data, handlers };

  relocated?.push(events);
}

export function normaliseComponents(
  nodes: NodeModel[],
  components: ComponentModel[],
  relocated?: ComponentModel[],
): ComponentModel[] {
  const result: ComponentModel[] = [];

  for (const node of nodes) {
    const kept = components.filter((c) => c.node === node.id);

    relocateStates(node.id, kept, relocated);
    relocateStateTiming(kept, relocated);

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
          existing.data = deepMerge(eff, migrated(type, existing.data));

          result.push(existing);
        } else {
          result.push({ node: node.id, type, data: eff } as ComponentModel);
        }
      }

      for (const c of kept) {
        if (ROOT_COMPONENTS.includes(c.type) || c.type === "core.transform")
          continue;

        c.data = deepMerge(
          effectiveDefaults("core.group", c.type),
          migrated(c.type, c.data),
        );

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
        existing.data = deepMerge(eff, migrated(type, existing.data));

        result.push(existing);
      } else {
        result.push({ node: node.id, type, data: eff } as ComponentModel);
      }
    }

    for (const c of kept) {
      if (guaranteed.includes(c.type)) continue;

      c.data = deepMerge(
        effectiveDefaults(node.type, c.type),
        migrated(c.type, c.data),
      );

      result.push(c);
    }
  }

  return result;
}
