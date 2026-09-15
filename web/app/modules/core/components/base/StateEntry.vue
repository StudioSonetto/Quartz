<template>
  <NodeComponentListEntry
    :index="props.index"
    :name="props.name"
    :active="props.active"
    :preview="preview"
  >
    <NodeComponentRow name="name">
      <NodeComponentRowFieldText
        lazy
        :value="props.name"
        :maxlength="32"
        @update:value="(v: string) => emit('rename', v.trim())"
      />
    </NodeComponentRow>
    <NodeComponentRow name="easing">
      <NodeComponentRowFieldSelect
        :options="EASING_OPTIONS"
        :value="props.state.easing"
        @update:value="(easing: string) => emit('patch', { easing })"
      />
    </NodeComponentRow>
  </NodeComponentListEntry>
</template>

<script setup lang="ts">
const props = defineProps<{
  index: number;
  name: string;
  state: Record<string, any>;
  active?: boolean;
}>();

const emit = defineEmits<{
  rename: [value: string];
  patch: [changes: Record<string, any>];
}>();

const preview = computed(() => props.state.easing ?? DEFAULT_STATE_EASING);
</script>
