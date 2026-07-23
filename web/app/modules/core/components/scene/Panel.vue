<template>
  <NodeComponent name="scene" :icon="props.icon">
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
  icon: string;
}>();

watch(props.component.data, () => {
  updateComponent(props.component);
});
</script>
