<template>
  <div class="row">
    <label>{{ name }}</label>
    <div class="fields">
      <!-- Showing the raw value under a binding reads as the property being
           wrong; it stays in the data as the fallback. -->
      <span v-if="source" class="row-bound-source">{{ source }}</span>
      <slot v-else />
    </div>
    <NodeComponentRowBind v-if="bindPath" :path="bindPath" :kind="bindKind" />
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
  bindPath?: string;
  bindKind?: VariableKind;
}>();

const { source } = useBoundSource(() => props.bindPath);
</script>
