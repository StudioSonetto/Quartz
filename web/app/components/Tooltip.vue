<template>
  <div class="tooltip">
    <slot />
    <span :style="{ 'margin-left': `-${width / 2 - 4}px` }" ref="el">
      {{ props.description }}
    </span>
  </div>
</template>

<style scoped lang="postcss">
.tooltip {
  span {
    @apply absolute opacity-0 invisible;
    @apply ui-text-3;
    @apply font-normal text-center;
    @apply bg-dark-200 border-rd;
    @apply p-2 mt-8 transition-opacity z-99;
  }
}

.tooltip:hover span {
  @apply opacity-100 visible;
}
</style>

<script setup lang="ts">
const props = defineProps<{
  description: string;
}>();

const el = ref<HTMLSpanElement>();
const width = useElementSize(el).width;
</script>
