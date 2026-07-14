<template>
  <NodeComponent name="transform">
    <NodeComponentRow name="position">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.position.x"
      />
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.position.y"
      />
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.position.z"
      />
    </NodeComponentRow>
    <NodeComponentRow name="width">
      <NodeComponentRowFieldNumber v-model:value="props.component.data.width" />
    </NodeComponentRow>
    <NodeComponentRow name="height">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.height"
      />
    </NodeComponentRow>
    <NodeComponentRow name="scale">
      <NodeComponentRowFieldNumber v-model:value="props.component.data.scale" />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const { updateComponent } = useDeckStore();

const props = defineProps<{
  component: ComponentModel;
}>();

watch(props.component.data, () => {
  updateComponent(props.component);
});
</script>
