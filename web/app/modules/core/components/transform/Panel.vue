<template>
  <NodeComponent name="transform" :icon="props.icon">
    <NodeComponentRow name="position">
      <NodeComponentRowFieldNumber
        :disabled="isGridChild"
        v-model:value="props.component.data.position.x"
      />
      <NodeComponentRowFieldNumber
        :disabled="isGridChild"
        v-model:value="props.component.data.position.y"
      />
      <NodeComponentRowFieldNumber
        :disabled="isGridChild"
        v-model:value="props.component.data.position.z"
      />
    </NodeComponentRow>
    <NodeComponentRow name="width">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'auto', icon: 'i-carbon-fit-to-width' },
          { value: 'fixed', icon: 'i-carbon-ruler' },
        ]"
        :value="widthMode"
        :disabled="isGroup"
        @update:value="(mode) => setAxis('width', mode)"
      />
      <NodeComponentRowFieldNumber
        v-if="widthMode === 'fixed'"
        :disabled="isGroup"
        v-model:value="props.component.data.size.width"
      />
    </NodeComponentRow>
    <NodeComponentRow name="height">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'auto', icon: 'i-carbon-fit-to-height' },
          { value: 'fixed', icon: 'i-carbon-ruler' },
        ]"
        :value="heightMode"
        :disabled="isGroup"
        @update:value="(mode) => setAxis('height', mode)"
      />
      <NodeComponentRowFieldNumber
        v-if="heightMode === 'fixed'"
        :disabled="isGroup"
        v-model:value="props.component.data.size.height"
      />
    </NodeComponentRow>
    <NodeComponentRow name="rotation">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.rotation"
      />
    </NodeComponentRow>
    <NodeComponentRow name="scale">
      <NodeComponentRowFieldNumber v-model:value="props.component.data.scale" />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const deck = useDeckStore();
const { updateComponent } = deck;
const { soleSelected } = storeToRefs(deck);
const { isGridChild: isNodeGridChild } = useNodeComponents();

const props = defineProps<{
  component: ComponentModel;
  icon: string;
}>();

const isGroup = computed(() => soleSelected.value?.type === "core.group");

const isGridChild = computed(() =>
  soleSelected.value ? isNodeGridChild(soleSelected.value) : false,
);

const widthMode = computed(() =>
  props.component.data.size.width === "auto" ? "auto" : "fixed",
);

const heightMode = computed(() =>
  props.component.data.size.height === "auto" ? "auto" : "fixed",
);

function setAxis(axis: "width" | "height", mode: string | string[]) {
  const next = Array.isArray(mode) ? mode[0] : mode;

  if (next === "auto") {
    props.component.data.size[axis] = "auto";

    return;
  }

  if (props.component.data.size[axis] !== "auto") return;

  const el = soleSelected.value
    ? document.getElementById(soleSelected.value.id)
    : null;

  const rendered = axis === "width" ? el?.offsetWidth : el?.offsetHeight;

  props.component.data.size[axis] = rendered || 100;
}

watch(props.component.data, () => {
  updateComponent(props.component);
});
</script>
