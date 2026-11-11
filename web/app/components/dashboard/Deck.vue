<template>
  <NuxtLink
    class="deck"
    :to="`/atelier/${props.id}`"
    @contextmenu.prevent="openMenu"
  >
    <div
      class="preview"
      :class="{ 'preview-deck': named }"
      :style="named && { viewTransitionName: `deck-${props.id}` }"
    >
      <AtelierRenderSnapshot :deck="props.id" />
    </div>
    <div class="info">
      <div class="meta">
        <input
          v-if="renaming"
          ref="titleInput"
          class="title title-input"
          :value="title"
          maxlength="255"
          @click.prevent
          @keydown.enter.prevent="($event.target as HTMLInputElement).blur()"
          @keydown.esc="renaming = false"
          @blur="rename(($event.target as HTMLInputElement).value)"
        />
        <p v-else class="title">{{ title }}</p>
        <p class="date">{{ new Date(props.last_modified).toLocaleString() }}</p>
      </div>
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
    @apply relative w-full aspect-video [view-transition-class:deck-card];
  }

  .info {
    @apply flex items-center justify-between;
    @apply px-4 py-3 bg-dark-800;
    @apply border-solid border-0 border-t-1 border-dark-200;

    .meta {
      .title {
        @apply ui-text-3 font-600 mb-1;
      }

      .title-input {
        @apply block w-full p-0 border-none bg-transparent text-inherit;
      }

      .date {
        @apply ui-text-3 opacity-60;
      }
    }
  }
}
</style>

<script setup lang="ts">
const { deleteDeck, duplicateDeck, patchDeck } = useDeckStore();

const props = defineProps<{
  title: string;
  id: string;
  last_modified: string;
  is_public?: boolean;
  slide_count?: number;
  named?: boolean;
}>();

const title = ref(props.title);
const renaming = ref(false);
const titleInput = ref<HTMLInputElement>();

watch(
  () => props.title,
  (value) => (title.value = value),
);

async function update(fields: Parameters<typeof patchDeck>[1]) {
  await patchDeck(props.id, fields);
  await refreshNuxtData("decks");
}

async function rename(value: string) {
  if (!renaming.value) return;

  renaming.value = false;

  const next = value.trim();

  if (!next || next === title.value) return;

  title.value = next;
  await update({ title: next });
}

function openMenu(event: MouseEvent) {
  useContextMenu().open(event, [
    {
      label: "Present",
      icon: "i-carbon-play",
      action: () => navigateTo(`/live/${props.id}`),
    },
    {
      label: "Rename",
      icon: "i-carbon-edit",
      action: async () => {
        renaming.value = true;
        await nextTick();
        titleInput.value?.focus();
        titleInput.value?.select();
      },
    },
    {
      label: "Duplicate",
      icon: "i-carbon-copy",
      action: () => duplicateDeck(props.id),
    },
    {
      label: props.is_public ? "Make Private" : "Make Public",
      icon: props.is_public ? "i-carbon-locked" : "i-carbon-earth",
      action: () => update({ is_public: !props.is_public }),
    },
    {
      label: "Delete",
      icon: "i-carbon-trash-can",
      danger: true,
      action: () => deleteDeck(props.id),
    },
  ]);
}
</script>
