<template>
  <NuxtLink
    class="deck"
    target="_blank"
    :to="`/atelier/${props.id}`"
    @contextmenu.prevent="
      useContextMenu().open($event, [
        {
          label: 'Delete',
          icon: 'i-carbon-trash-can',
          shortcut: '⌫',
          danger: true,
          action: () => deleteDeck(props.id),
        },
      ])
    "
  >
    <div class="preview">
      <AtelierRenderSnapshot :deck="props.id" />
      <span v-if="props.slide_count" class="slides-badge"
        >{{ props.slide_count }} slides</span
      >
    </div>
    <div class="info">
      <div class="meta">
        <p class="title">{{ props.title }}</p>
        <p class="date">{{ new Date(props.last_modified).toLocaleString() }}</p>
      </div>
      <span class="type">DECK</span>
    </div>
  </NuxtLink>
</template>

<style scoped lang="postcss">
.deck {
  @apply block w-sm bg-dark-800;
  @apply border-rd-lg border-solid border-1 border-dark-200;
  @apply overflow-hidden transition-all cursor-pointer;

  &:hover {
    @apply border-accent;
    box-shadow:
      0 0 0 1px #4a6578,
      0 8px 32px rgba(37, 53, 69, 0.4);
  }

  .preview {
    @apply relative w-full aspect-video bg-light-200;

    .slides-badge {
      @apply absolute bottom-3 right-3;
      @apply px-2 py-0.5 ui-text-3;
      @apply bg-dark-900/70 text-light-200 border-rd;
    }
  }

  .info {
    @apply flex items-center justify-between;
    @apply px-4 py-3 bg-dark-800;
    @apply border-solid border-0 border-t-1 border-dark-200;

    .meta {
      .title {
        @apply ui-text-3 font-600 mb-1;
      }

      .date {
        @apply ui-text-3 opacity-60;
      }
    }

    .type {
      @apply ui-text-3 text-accent font-500 tracking-wider flex-shrink-0;
    }
  }
}
</style>

<script setup lang="ts">
const { deleteDeck } = useDeckStore();

const props = defineProps<{
  title: string;
  id: string;
  last_modified: string;
  slide_count?: number;
}>();
</script>
