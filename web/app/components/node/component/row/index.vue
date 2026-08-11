<template>
  <div class="row">
    <label>{{ name }}</label>
    <div class="fields">
      <!-- Showing the raw value under a binding reads as the property being
           wrong; it stays in the data as the fallback. -->
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
// `path` makes the row own its data: it reads and writes that key across the
// selection, so a panel states the path once instead of in the field, the
// setter and the binding. `kind` additionally makes the row bindable.
const props = defineProps<{
  name: string;
  path?: string;
  kind?: VariableKind;
}>();

const { components, source } = useBoundSource(() => props.path);
const { field, set } = useMergedFields(components);

const segments = computed(() => props.path?.split(".") ?? []);

// Blank when the selection disagrees, which is what `field` already does.
const value = computed(() => (props.path ? field(segments.value) : undefined));

function update(next: unknown) {
  set(segments.value, next);
}
</script>
