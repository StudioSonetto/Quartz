<template>
  <div :class="{ 'opacity-100!': isOpen }" class="component">
    <header @click="toggleComponent">
      <h4>
        <div class="icon" :class="icon"></div>
        {{ props.name.toUpperCase() }}
      </h4>
      <div
        :class="isOpen ? 'i-carbon-caret-down' : 'i-carbon-caret-right'"
        class="arrow"
      ></div>
    </header>
    <div v-if="isOpen" class="rows">
      <slot />
    </div>
  </div>
</template>

<style scoped lang="postcss">
.component {
  @apply w-full bg-dark-900 relative;
  @apply border-solid border-0 border-b-2 border-dark-200;
  @apply opacity-60 hover:opacity-100;
  @apply transition-opacity duration-150;

  &:has(.rows) {
    @apply opacity-100;

    &::before {
      content: "";
      @apply absolute left-0 top-0 bottom-0 w-0.5;
      @apply bg-accent;
    }
  }

  header {
    @apply flex items-center justify-between p-6 cursor-pointer;

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
const props = defineProps<{
  name: string;
}>();

const isOpen = ref(false);

const icon = computed(() => {
  switch (props.name) {
    case "base":
      return "i-carbon-term";

    case "camera":
      return "i-carbon-camera";

    case "layout":
      return "i-carbon-template";

    case "model":
      return "i-carbon-model-alt";

    case "scene":
      return "i-carbon-web-services-container";

    case "transform":
      return "i-carbon-shapes";

    case "typography":
      return "i-carbon-text-font";
  }
});

function toggleComponent() {
  isOpen.value = !isOpen.value;
}
</script>
