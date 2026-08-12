<template>
  <div class="row">
    <label>{{ name }}</label>
    <div class="fields">
      <span v-if="source" class="row-bound-source">{{ source }}</span>
      <slot v-else :value="value" :update="update" />
    </div>
    <NodeComponentRowBind v-if="path && kind" :path="path" :kind="kind" />
  </div>
</template>

<style scoped lang="postcss">
.row-bound-source {
  @apply flex-1 w-0 truncate text-accent;
}
</style>

<script setup lang="ts">
const props = defineProps<{
  name: string;
  path?: string;
  kind?: VariableKind;
}>();

const { components, source } = useBoundSource(() => props.path);
const { field, set } = useMergedFields(components);

const segments = computed(() => props.path?.split(".") ?? []);

const value = computed(() => (props.path ? field(segments.value) : undefined));

function update(next: unknown) {
  set(segments.value, next);
}
</script>
