<template>
  <NodeComponent name="transform" :icon="props.icon">
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
    <NodeComponentRow name="rotation">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.rotation.x"
      />
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.rotation.y"
      />
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.rotation.z"
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
  icon: string;
}>();

watch(props.component.data, () => {
  updateComponent(props.component);
});
</script>
