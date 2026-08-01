<template>
  <NodeComponent name="camera" :icon="props.icon">
    <NodeComponentRow name="position">
      <NodeComponentRowFieldNumber
        :value="field(['x'])"
        @update:value="(v) => set(['x'], v)"
      />
      <NodeComponentRowFieldNumber
        :value="field(['y'])"
        @update:value="(v) => set(['y'], v)"
      />
      <NodeComponentRowFieldNumber
        :value="field(['z'])"
        @update:value="(v) => set(['z'], v)"
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
