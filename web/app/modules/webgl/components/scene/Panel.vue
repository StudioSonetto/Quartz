<template>
  <NodeComponent name="scene" :icon="props.icon">
    <NodeComponentRow name="background">
      <NodeComponentRowFieldColour
        :value="field(['background'])"
        @update:value="(v) => set(['background'], v)"
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

const { field, set } = useMergedFields(() => props.components);
</script>
