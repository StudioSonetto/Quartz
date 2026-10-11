<template>
  <NodeComponent
    name="transition"
    :icon="props.icon"
    :components="props.components"
  >
    <NodeComponentRow name="kind" path="kind" v-slot="{ value, update }">
      <NodeComponentRowFieldSelect
        :options="SLIDE_TRANSITION_KINDS"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="duration"
      path="duration"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber
        :min="0"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow name="easing" path="easing" v-slot="{ value, update }">
      <NodeComponentRowFieldSelect
        :options="EASING_OPTIONS"
        :value="value"
        @update:value="update"
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
</script>
