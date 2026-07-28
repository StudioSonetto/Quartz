<template>
  <div :class="{ 'opacity-100!': isOpen }" class="component">
    <button
      type="button"
      class="header"
      :tabindex="isOpen ? -1 : undefined"
      @click="toggleComponent"
    >
      <h4>
        <div class="icon" :class="props.icon"></div>
        {{ props.name.toUpperCase() }}
      </h4>
      <div
        :class="isOpen ? 'i-carbon-caret-down' : 'i-carbon-caret-right'"
        class="arrow"
      ></div>
    </button>
    <div v-if="isOpen" class="rows">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.component {
  @apply w-full bg-dark-900 relative;
  @apply border-solid border-0 border-b-2 border-dark-200;
  @apply opacity-60 hover:opacity-100 focus-within:opacity-100;
  @apply transition-opacity duration-150;

  &:has(.rows) {
    @apply opacity-100;

    &::before {
      content: "";
      @apply absolute left-0 top-0 bottom-0 w-0.5;
      @apply bg-accent;
    }
  }

  .header {
    @apply w-full bg-transparent border-none text-left text-light-200;
    @apply flex items-center justify-between p-6 cursor-pointer;

    &:focus-visible {
      @apply outline-none;
    }

    h4 {
      @apply ui-text-3;
      @apply font-300 opacity-80;
      @apply flex items-center gap-2;

      .icon {
        @apply ui-text-4 transition-colors;
      }
    }

    .arrow {
      @apply ui-text-5 opacity-80;
    }
  }

  .rows {
    @apply px-6 pb-6;

    &:deep(.row) {
      @apply flex ui-text-3;

      &:not(:last-child) {
        @apply mb-6;
      }

      label {
        @apply ui-text-3 w-1/3;
      }

      .fields {
        @apply flex flex-1 gap-6;

        .field {
          @apply w-full flex;

          > * {
            @apply w-0 p-0 flex-1;
          }
        }
      }
    }
  }
}
</style>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string;
    icon?: string;
  }>(),
  { icon: "i-carbon-help" },
);

const atelier = useAtelierStore();
const { soleSelected } = storeToRefs(useDeckStore());

const key = computed(() => `${soleSelected.value?.id ?? ""}:${props.name}`);
const isOpen = computed(() => atelier.isComponentOpen(key.value));

function toggleComponent() {
  atelier.toggleComponentOpen(key.value);
}
</script>
