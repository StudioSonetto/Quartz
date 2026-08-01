<template>
  <NodeComponent name="transform" :icon="props.icon">
    <NodeComponentRow name="position">
      <NodeComponentRowFieldNumber
        :value="field(['position', 'x'])"
        @update:value="(v) => set(['position', 'x'], v)"
      />
      <NodeComponentRowFieldNumber
        :value="field(['position', 'y'])"
        @update:value="(v) => set(['position', 'y'], v)"
      />
      <NodeComponentRowFieldNumber
        :value="field(['position', 'z'])"
        @update:value="(v) => set(['position', 'z'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="rotation">
      <NodeComponentRowFieldNumber
        :value="field(['rotation', 'x'])"
        @update:value="(v) => set(['rotation', 'x'], v)"
      />
      <NodeComponentRowFieldNumber
        :value="field(['rotation', 'y'])"
        @update:value="(v) => set(['rotation', 'y'], v)"
      />
      <NodeComponentRowFieldNumber
        :value="field(['rotation', 'z'])"
        @update:value="(v) => set(['rotation', 'z'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="scale">
      <NodeComponentRowFieldNumber
        :value="field(['scale'])"
        @update:value="(v) => set(['scale'], v)"
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
