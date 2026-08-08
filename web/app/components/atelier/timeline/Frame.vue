<template>
  <div
    @click="!isSelected && (currentSlidesIndex = props.index)"
    @contextmenu.prevent="openMenu"
    :class="{
      'opacity-60 cursor-pointer': !isSelected,
    }"
    class="frame"
  >
    <AtelierRenderSnapshot v-if="slide" :deck="slide.deck" :slides="slide.id" />
    <div class="overlay">
      <div
        v-if="isSelected"
        @click.stop="openMenu"
        class="i-carbon-overflow-menu-horizontal menu"
      ></div>
      <p class="indicator">
        {{ props.index + 1 }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.frame {
  @apply bg-light-200 aspect-video min-w-[100px];
  @apply transition-opacity transform-gpu border-rd;

  .overlay {
    @apply text-dark-900;

    .menu {
      @apply absolute top-2 right-3;
      @apply ui-text-5 cursor-pointer;
      @apply opacity-0 transition-opacity;
    }

    .indicator {
      @apply absolute bottom-2 left-3;
      @apply ui-text-3 transition-opacity;
    }
  }

  &:hover {
    .menu {
      @apply opacity-100;
    }
  }
}
</style>

<script setup lang="ts">
const { deleteSlides } = useDeckStore();
const { slides, currentSlidesIndex } = storeToRefs(useDeckStore());

const props = defineProps<{
  index: number;
}>();

const slide = computed(() => slides.value[props.index]);

const isSelected = computed(() => currentSlidesIndex.value === props.index);

function openMenu(event: MouseEvent) {
  const target = slide.value;

  if (!target || slides.value.length <= 1) return;

  useContextMenu().open(event, [
    {
      label: "Delete",
      icon: "i-carbon-trash-can",
      danger: true,
      action: () => deleteSlides(target.id),
    },
  ]);
}
</script>
