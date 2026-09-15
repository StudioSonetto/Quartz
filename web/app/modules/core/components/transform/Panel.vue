<template>
  <NodeComponent
    name="transform"
    :icon="props.icon"
    :components="props.components"
  >
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
        :disabled="autoUnavailable"
        @update:value="(mode) => setAxis('width', mode)"
      />
      <NodeComponentRowFieldNumber
        v-if="widthMode === 'fixed'"
        :disabled="sizeLocked"
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
        :disabled="autoUnavailable"
        @update:value="(mode) => setAxis('height', mode)"
      />
      <NodeComponentRowFieldNumber
        v-if="heightMode === 'fixed'"
        :disabled="sizeLocked"
        :value="field(['size', 'height'])"
        @update:value="(v) => set(['size', 'height'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="rotation"
      path="rotation"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber
        :value="value"
        @update:value="(v) => update(wrapAngle(v))"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="scale"
      path="scale"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
import { getNodeType } from "~/modules/registry";

const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { isGridChild } = useNodeComponents();
const { updateComponent } = useDeckStore();
const { field, set } = useMergedFields(() => props.components);

const anyGridChild = computed(() => props.nodes.some((n) => isGridChild(n)));

const sizingOf = (n: Tree) => getNodeType(n.type)?.sizing ?? "free";

const sizeLocked = computed(() =>
  props.nodes.some((n) => sizingOf(n) === "derived"),
);
const autoUnavailable = computed(() =>
  props.nodes.some((n) => sizingOf(n) !== "free"),
);

function axisMode(axis: "width" | "height") {
  const modes = props.components.map((c) =>
    c.data.size?.[axis] === "auto" ? "auto" : "fixed",
  );
  return allEqual(modes, undefined);
}
const widthMode = computed(() => axisMode("width"));
const heightMode = computed(() => axisMode("height"));

function setAxis(axis: "width" | "height", mode: string | string[]) {
  const next = Array.isArray(mode) ? mode[0] : mode;

  if (next === "auto") {
    set(["size", axis], "auto");
    return;
  }

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
