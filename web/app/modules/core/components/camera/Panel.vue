<template>
  <NodeComponent name="camera">
    <NodeComponentRow name="position">
      <NodeComponentRowFieldNumber name="x" v-model:value="component.data.x" />
      <NodeComponentRowFieldNumber name="y" v-model:value="component.data.y" />
      <NodeComponentRowFieldNumber name="z" v-model:value="component.data.z" />
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
