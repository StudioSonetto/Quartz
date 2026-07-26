<template>
  <NodeComponent name="layout" :icon="props.icon">
    <NodeComponentRow name="mode">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'free', icon: 'i-carbon-move' },
          { value: 'grid', icon: 'i-carbon-grid' },
        ]"
        v-model:value="props.component.data.mode"
      />
    </NodeComponentRow>
    <NodeComponentRow name="background">
      <NodeComponentRowFieldColour
        v-model:value="props.component.data.background"
      />
    </NodeComponentRow>
    <NodeComponentRow name="padding">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.padding"
      />
    </NodeComponentRow>
    <NodeComponentRow name="columns">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.columns"
      />
    </NodeComponentRow>
    <NodeComponentRow name="gap">
      <NodeComponentRowFieldNumber v-model:value="props.component.data.gap" />
    </NodeComponentRow>
    <NodeComponentRow name="align">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'start', icon: 'i-carbon-align-vertical-top' },
          { value: 'center', icon: 'i-carbon-align-vertical-center' },
          { value: 'end', icon: 'i-carbon-align-vertical-bottom' },
        ]"
        v-model:value="props.component.data.align"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const deck = useDeckStore();
const { updateComponent } = deck;
const { selectedNode } = storeToRefs(deck);
const { getNodeComponent } = useNodeComponents();

const props = defineProps<{
  component: ComponentModel;
  icon: string;
}>();

function anchorGroupToChildren() {
  const group = selectedNode.value;

  if (!group) return;

  const transform = getNodeComponent(group.id, "core.transform");

  if (!transform) return;

  let minX = Infinity;
  let minY = Infinity;

  for (const child of group.children) {
    const childTransform = getNodeComponent(child.id, "core.transform");

    if (!childTransform) continue;

    minX = Math.min(minX, childTransform.data.position.x);
    minY = Math.min(minY, childTransform.data.position.y);
  }

  if (minX === Infinity) return;

  transform.data.position.x = Math.round(minX);
  transform.data.position.y = Math.round(minY);

  updateComponent(transform);
}

watch(props.component.data, () => {
  updateComponent(props.component);
});

watch(
  () => props.component.data.mode,
  (mode) => {
    if (mode !== "grid") return;

    anchorGroupToChildren();
  },
);
</script>
