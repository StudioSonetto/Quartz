<template>
  <NodeComponent name="path" :icon="props.icon" :components="props.components">
    <NodeComponentRow name="points">
      <p>{{ count }}</p>
    </NodeComponentRow>
    <NodeComponentRow name="closed" path="closed" v-slot="{ value, update }">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'open', icon: 'i-carbon-draw' },
          { value: 'closed', icon: 'i-carbon-closed-caption' },
        ]"
        :value="value ? 'closed' : 'open'"
        @update:value="(v) => update(toClosed(v))"
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

const { field } = useMergedFields(() => props.components);

const count = computed(() => (field(["points"]) ?? []).length);

function toClosed(value: string | string[]) {
  return (Array.isArray(value) ? value[0] : value) === "closed";
}
</script>
