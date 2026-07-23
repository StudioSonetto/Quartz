<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isVisible"
        ref="menuRef"
        :style="{ top: `${y}px`, left: `${x}px` }"
        class="contextMenu"
        @contextmenu.prevent="isVisible = false"
      >
        <template v-for="(item, i) in menuItems" :key="item.label">
          <hr
            v-if="item.danger && i > 0 && !menuItems[i - 1]?.danger"
            class="separator"
          />
          <button
            :class="{ danger: item.danger }"
            @click="handleItemClick(item)"
          >
            <span
              v-if="item.icon"
              :class="[item.icon, 'text-base mr-2 flex-shrink-0']"
            ></span>
            <span class="flex-1 text-left">{{ item.label }}</span>
            <span v-if="item.shortcut" class="shortcut">{{
              item.shortcut
            }}</span>
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="postcss">
.contextMenu {
  @apply w-52 bg-dark-900 z-99 absolute;
  @apply border-rd border-solid border-1 border-dark-200;
  @apply overflow-hidden;

  .separator {
    @apply border-0 border-t-1 border-solid border-dark-200 m-0;
  }

  button {
    @apply w-full h-12 px-4 cursor-pointer transition-colors;
    @apply flex items-center;
    @apply border-solid border-0 border-b-1 border-dark-200;

    &:last-child {
      @apply border-b-0;
    }

    &:not(.danger) {
      @apply hover:bg-light-200 hover:text-dark-900;
    }

    &.danger {
      @apply text-red-500;
      @apply hover:bg-red-500 hover:text-white;
    }

    .shortcut {
      @apply opacity-40 ui-text-3 ml-4 flex-shrink-0;
    }
  }
}
</style>

<script setup lang="ts">
import { onClickOutside, onKeyStroke } from "@vueuse/core";

const isVisible = ref(false);
const menuItems = ref<ContextMenuItem[]>([]);
const menuRef = ref<HTMLElement | null>(null);

const x = ref(0);
const y = ref(0);

onClickOutside(menuRef, () => {
  isVisible.value = false;
});

onKeyStroke("Escape", () => {
  if (isVisible.value) isVisible.value = false;
});

function handleItemClick(item: ContextMenuItem) {
  item.action();

  isVisible.value = false;
}

const openContextMenu = (event: MouseEvent, _menuItems: ContextMenuItem[]) => {
  x.value = event.clientX + 10;
  y.value = event.clientY + 10;

  isVisible.value = true;
  menuItems.value = _menuItems;
};

const handleOpenContextMenu = (event: Event) => {
  const e = event as ContextMenuEvent;

  openContextMenu(e.detail.event, e.detail.menuItems);
};

onMounted(() => {
  window.addEventListener("openContextMenu", handleOpenContextMenu);
});

onUnmounted(() => {
  window.removeEventListener("openContextMenu", handleOpenContextMenu);
});
</script>
