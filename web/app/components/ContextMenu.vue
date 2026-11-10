<template>
  <Teleport to="body">
    <Transition name="fade" @after-leave="menuItems = []">
      <div
        v-if="isVisible"
        ref="menuRef"
        :style="{ top: `${y}px`, left: `${x}px` }"
        class="context-menu"
        @contextmenu.prevent="isVisible = false"
      >
        <template v-for="(item, i) in menuItems" :key="item.label">
          <hr
            v-if="item.danger && i > 0 && !menuItems[i - 1]?.danger"
            class="menu-separator"
          />
          <UIButton
            variant="menu"
            :danger="item.danger"
            @click="handleItemClick(item)"
          >
            <span v-if="item.icon" :class="[item.icon, 'menu-icon']"></span>
            {{ item.label }}
            <span v-if="item.shortcut" class="menu-shortcut">{{
              item.shortcut
            }}</span>
          </UIButton>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="postcss">
.context-menu {
  @apply absolute z-99 overflow-hidden;
  @apply min-w-52 w-max;
  @apply ui-text-3 whitespace-nowrap;
  @apply bg-dark-900 text-light-200;
  @apply border-rd border-solid border-1 border-dark-200;

  &.fade-leave-active {
    @apply transition-opacity duration-150;
  }

  &.fade-leave-to {
    @apply opacity-0;
  }

  button:last-child {
    @apply border-b-0;
  }

  .menu-separator {
    @apply border-0 border-t-1 border-solid border-dark-200;
  }

  .menu-icon {
    @apply mr-2 ui-text-4;
  }

  .menu-shortcut {
    @apply ml-auto pl-4 ui-text-4 opacity-60;
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
  Promise.resolve(item.action()).catch((error) =>
    console.error("context menu action failed", item.label, error),
  );

  isVisible.value = false;
}

const openContextMenu = async (
  event: MouseEvent,
  _menuItems: ContextMenuItem[],
) => {
  x.value = event.clientX + 10;
  y.value = event.clientY + 10;

  isVisible.value = true;
  menuItems.value = _menuItems;

  await nextTick();

  const menu = menuRef.value;

  if (!menu) return;

  x.value = Math.max(8, Math.min(x.value, innerWidth - menu.offsetWidth - 8));
  y.value = Math.max(8, Math.min(y.value, innerHeight - menu.offsetHeight - 8));
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
