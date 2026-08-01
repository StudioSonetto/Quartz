<template>
  <NodeComponent name="layout" :icon="props.icon">
    <NodeComponentRow name="mode">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'free', icon: 'i-carbon-move' },
          { value: 'grid', icon: 'i-carbon-grid' },
        ]"
        :value="field(['mode'])"
        @update:value="(v) => setMode(v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="background">
      <NodeComponentRowFieldColour
        :value="field(['background'])"
        @update:value="(v) => set(['background'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="padding">
      <NodeComponentRowFieldNumber
        :value="field(['padding'])"
        @update:value="(v) => set(['padding'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="columns">
      <NodeComponentRowFieldNumber
        :value="field(['columns'])"
        @update:value="(v) => set(['columns'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="gap">
      <NodeComponentRowFieldNumber
        :value="field(['gap'])"
        @update:value="(v) => set(['gap'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="align">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'start', icon: 'i-carbon-align-vertical-top' },
          { value: 'center', icon: 'i-carbon-align-vertical-center' },
          { value: 'end', icon: 'i-carbon-align-vertical-bottom' },
        ]"
        :value="field(['align'])"
        @update:value="(v) => set(['align'], v)"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { getNodeComponent } = useNodeComponents();
const { updateComponent } = useDeckStore();
const { field, set } = useMergedFields(() => props.components);

// Anchor a group's transform to its children's top-left — mirrors the original
// single-node behaviour on switch to grid.
function anchorGroupToChildren(group: Tree) {
  const transform = getNodeComponent(group.id, "core.transform");
  if (!transform) return;
  let minX = Infinity;
  let minY = Infinity;
  for (const child of group.children) {
    const ct = getNodeComponent(child.id, "core.transform");
    if (!ct) continue;
    minX = Math.min(minX, ct.data.position.x);
    minY = Math.min(minY, ct.data.position.y);
  }
  if (minX === Infinity) return;
  const data = setNested(
    setNested(transform.data, ["position", "x"], Math.round(minX)),
    ["position", "y"],
    Math.round(minY),
  );
  updateComponent({ ...transform, data });
}

function setMode(mode: string | string[]) {
  const next = Array.isArray(mode) ? mode[0] : mode;
  set(["mode"], next);
  if (next === "grid") {
    for (const n of props.nodes) {
      if (n.path === ROOT_PATH) continue;
      anchorGroupToChildren(n);
    }
  }
}
</script>
