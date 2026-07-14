<template>
  <NodeComponent name="scene">
    <NodeComponentRow name="background">
      <NodeComponentRowFieldColour
        v-model:value="props.component.data.background"
      />
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
