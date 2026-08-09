<template>
  <div v-if="preview" data-html2canvas-ignore class="ghost" :style="style">
    <span :class="preview.icon" />
    <span>{{ preview.label }}</span>
  </div>
</template>

<style scoped lang="postcss">
.ghost {
  @apply absolute z-50 pointer-events-none;
  @apply flex items-center justify-center gap-2;
  @apply border-1 border-solid border-accent border-rd bg-accent/10;
  @apply ui-text-4 text-accent;
  @apply px-3 py-1;
}
</style>

<script setup lang="ts">
const { preview } = useAssetDrag();

const style = computed(() => {
  const p = preview.value;

  if (!p) return {};

  return {
    left: `${p.left}px`,
    top: `${p.top}px`,
    ...(p.width === null
      ? {}
      : { width: `${p.width}px`, height: `${p.height}px` }),
  };
});
</script>
