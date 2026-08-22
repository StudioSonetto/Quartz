<template>
  <div
    class="component-list-entry"
    :class="{ 'component-list-entry-selected': selected }"
    @click="list?.select(props.index)"
  >
    <div
      class="component-list-entry-header"
      @dblclick="expandable && list?.toggle(props.index)"
    >
      <div
        v-if="expandable"
        class="component-list-entry-caret i-carbon-caret-right"
        :class="{ 'component-list-entry-caret-open': open }"
      ></div>
      <span
        class="component-list-entry-name"
        :class="{ 'component-list-entry-name-active': props.active }"
      >
        {{ props.name || "unnamed" }}
      </span>
      <span v-if="props.issue" class="component-list-entry-issue">
        {{ props.issue }}
      </span>
      <span
        v-else-if="props.preview || props.swatch"
        class="component-list-entry-preview"
      >
        <span
          v-if="props.swatch"
          class="component-list-entry-swatch"
          :style="{ background: props.swatch }"
        ></span>
        {{ props.preview }}
      </span>
    </div>
    <div v-if="expandable && open" class="component-list-entry-rows">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.component-list-entry {
  @apply w-full border-solid border border-transparent;

  &.component-list-entry-selected {
    @apply border-accent;
  }

  .component-list-entry-header {
    @apply flex gap-2 cursor-pointer select-none;

    &:has(+ .component-list-entry-rows) {
      @apply mb-6;
    }

    .component-list-entry-caret {
      @apply transition-transform;

      &.component-list-entry-caret-open {
        @apply rotate-90;
      }
    }

    .component-list-entry-name {
      @apply flex-1 w-0 truncate;

      &.component-list-entry-name-active {
        @apply text-accent;
      }
    }

    .component-list-entry-preview {
      @apply opacity-60 truncate max-w-1/2;
    }

    .component-list-entry-swatch {
      @apply w-3 h-3 mr-1 inline-block align-middle;
      @apply border-solid border border-dark-200;
    }

    .component-list-entry-issue {
      @apply text-red-400 truncate max-w-1/2;
    }
  }

  .component-list-entry-rows {
    @apply pb-2;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  index: number;
  name: string;
  preview?: string;
  issue?: string;
  swatch?: string;
  active?: boolean;
}>();

const list = useComponentList();

const expandable = !!useSlots().default;

const selected = computed(() => list?.selected.value === props.index);
const open = computed(() => !!list?.open.value.has(props.index));
</script>
