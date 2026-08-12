<template>
  <div
    v-if="preview?.mode === 'file'"
    data-html2canvas-ignore
    class="drop-surface"
  >
    <span>Drop to upload</span>
  </div>
  <div
    v-else-if="preview"
    data-html2canvas-ignore
    class="drop-ghost"
    :style="style"
  >
    <span :class="preview.icon" />
    <span>{{ preview.label }}</span>
  </div>
</template>

<style scoped lang="postcss">
.drop-ghost {
  @apply absolute z-50 pointer-events-none;
  @apply flex items-center justify-center gap-2;
  @apply border-1 border-solid border-accent border-rd bg-accent/10;
  @apply ui-text-4 text-accent;
  @apply px-3 py-1;
}

.drop-surface {
  @apply absolute inset-0 z-50 pointer-events-none;
  @apply flex items-center justify-center;
  @apply border-2 border-dashed border-accent bg-accent/10;
  @apply ui-text-4 text-accent;
}
</style>

<script setup lang="ts">
const { preview } = useAssetDrag();

const style = computed(() => {
  const p = preview.value;

  if (p?.mode !== "node") return {};

  return {
    left: `${p.left}px`,
    top: `${p.top}px`,
    ...(p.width === null
      ? {}
      : { width: `${p.width}px`, height: `${p.height}px` }),
  };
});
</script>
