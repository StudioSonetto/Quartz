<template>
  <NodeComponent name="transform" :icon="props.icon">
    <NodeComponentRow name="position">
      <NodeComponentRowFieldNumber
        :disabled="anyGridChild"
        :value="field(['position', 'x'])"
        @update:value="(v) => set(['position', 'x'], v)"
      />
      <NodeComponentRowFieldNumber
        :disabled="anyGridChild"
        :value="field(['position', 'y'])"
        @update:value="(v) => set(['position', 'y'], v)"
      />
      <NodeComponentRowFieldNumber
        :disabled="anyGridChild"
        :value="field(['position', 'z'])"
        @update:value="(v) => set(['position', 'z'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="width">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'auto', icon: 'i-carbon-fit-to-width' },
          { value: 'fixed', icon: 'i-carbon-ruler' },
        ]"
        :value="widthMode"
        :disabled="anyGroup"
        @update:value="(mode) => setAxis('width', mode)"
      />
      <NodeComponentRowFieldNumber
        v-if="widthMode === 'fixed'"
        :disabled="anyGroup"
        :value="field(['size', 'width'])"
        @update:value="(v) => set(['size', 'width'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="height">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'auto', icon: 'i-carbon-fit-to-height' },
          { value: 'fixed', icon: 'i-carbon-ruler' },
        ]"
        :value="heightMode"
        :disabled="anyGroup"
        @update:value="(mode) => setAxis('height', mode)"
      />
      <NodeComponentRowFieldNumber
        v-if="heightMode === 'fixed'"
        :disabled="anyGroup"
        :value="field(['size', 'height'])"
        @update:value="(v) => set(['size', 'height'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="rotation">
      <NodeComponentRowFieldNumber
        :value="field(['rotation'])"
        @update:value="(v) => set(['rotation'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="scale">
      <NodeComponentRowFieldNumber
        :value="field(['scale'])"
        @update:value="(v) => set(['scale'], v)"
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

const { isGridChild } = useNodeComponents();
const { updateComponent } = useDeckStore();
const { field, set } = useMergedFields(() => props.components);

// Position is layout-driven for grid children; groups hug their contents.
const anyGridChild = computed(() => props.nodes.some((n) => isGridChild(n)));
const anyGroup = computed(() =>
  props.nodes.some((n) => n.type === "core.group"),
);

// Shared width/height mode across the selection: "auto", "fixed", or undefined
// (radio shows nothing selected) when the nodes disagree.
function axisMode(axis: "width" | "height") {
  const modes = props.components.map((c) =>
    c.data.size?.[axis] === "auto" ? "auto" : "fixed",
  );
  return allEqual(modes, undefined);
}
const widthMode = computed(() => axisMode("width"));
const heightMode = computed(() => axisMode("height"));

// Switch an axis for every selected transform. On auto→fixed, seed each node's
// own rendered size; nodes already fixed keep their number.
function setAxis(axis: "width" | "height", mode: string | string[]) {
  const next = Array.isArray(mode) ? mode[0] : mode;
  // Auto is the same value for every node → the shared fan-out write.
  if (next === "auto") {
    set(["size", axis], "auto");
    return;
  }
  // Fixed seeds each node's own rendered size, so write per component.
  for (const c of props.components) {
    if (c.data.size?.[axis] !== "auto") continue;
    const el = document.getElementById(c.node);
    const rendered = axis === "width" ? el?.offsetWidth : el?.offsetHeight;
    updateComponent({
      ...c,
      data: setNested(c.data, ["size", axis], rendered || 100),
    });
  }
}
</script>
