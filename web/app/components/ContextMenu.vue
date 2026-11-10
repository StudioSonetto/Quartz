<template>
  <Teleport to="body">
    <Transition name="fade-fast" @after-leave="isVisible || (panels = [])">
      <div v-if="isVisible" ref="menuRef" class="context-menu-layer">
        <div
          v-for="(panel, depth) in panels"
          :key="depth"
          :ref="(el) => (panelEls[depth] = el as HTMLElement)"
          :style="{ top: `${panel.y}px`, left: `${panel.x}px` }"
          class="context-menu"
          @contextmenu.prevent="isVisible = false"
        >
          <template
            v-for="(item, i) in panel.items"
            :key="item.id ?? item.label"
          >
            <hr
              v-if="item.danger && i > 0 && !panel.items[i - 1]?.danger"
              class="menu-separator"
            />
            <UIButton
              variant="menu"
              :danger="item.danger"
              @click="handleItemClick(item)"
              @mouseenter="openSubmenu(item, $event, depth)"
            >
              <span v-if="item.icon" :class="[item.icon, 'menu-icon']"></span>
              {{ item.label }}
              <span
                v-if="item.children"
                class="i-carbon-chevron-right menu-shortcut"
              ></span>
              <span v-else-if="item.shortcut" class="menu-shortcut">{{
                item.shortcut
              }}</span>
            </UIButton>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="postcss">
.context-menu-layer {
  @apply fixed inset-0 z-99 pointer-events-none;
}

.context-menu {
  @apply absolute overflow-hidden pointer-events-auto;
  @apply min-w-60 w-max;
  @apply ui-text-3 whitespace-nowrap;
  @apply bg-dark-900 text-light-200;
  @apply border-rd border-solid border-1 border-dark-200;

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
    @apply ml-auto pl-4 ui-text-3 opacity-60;
  }
}
</style>

<script setup lang="ts">
import { clamp, onClickOutside, onKeyStroke } from "@vueuse/core";

type Panel = { items: ContextMenuItem[]; x: number; y: number };

const isVisible = ref(false);
const panels = ref<Panel[]>([]);
const menuRef = ref<HTMLElement | null>(null);
const panelEls: HTMLElement[] = [];

onClickOutside(menuRef, () => {
  isVisible.value = false;
});

onKeyStroke("Escape", () => {
  if (isVisible.value) isVisible.value = false;
});

function handleItemClick(item: ContextMenuItem) {
  if (item.children) return;

  Promise.resolve(item.action?.()).catch((error) =>
    console.error("context menu action failed", item.label, error),
  );

  isVisible.value = false;
}

async function show(depth: number, panel: Panel) {
  panels.value = [...panels.value.slice(0, depth), panel];

  await nextTick();

  const el = panelEls[depth];
  const placed = panels.value[depth];
  const parent = panelEls[depth - 1]?.getBoundingClientRect();

  if (!el || !placed) return;

  if (parent && placed.x + el.offsetWidth > innerWidth - 8)
    placed.x = parent.left - el.offsetWidth + 1;

  placed.x = clamp(placed.x, 8, innerWidth - el.offsetWidth - 8);
  placed.y = clamp(placed.y, 8, innerHeight - el.offsetHeight - 8);
}

function openSubmenu(item: ContextMenuItem, event: MouseEvent, depth: number) {
  if (!item.children) return (panels.value = panels.value.slice(0, depth + 1));
  if (panels.value[depth + 1]?.items === item.children) return;

  const row = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const menu = panelEls[depth]!.getBoundingClientRect();

  show(depth + 1, { items: item.children, x: menu.right - 1, y: row.top - 1 });
}

const handleOpenContextMenu = (event: Event) => {
  const { event: e, menuItems } = (event as ContextMenuEvent).detail;

  isVisible.value = true;
  show(0, { items: menuItems, x: e.clientX + 10, y: e.clientY + 10 });
};

onMounted(() => {
  window.addEventListener("openContextMenu", handleOpenContextMenu);
});

onUnmounted(() => {
  window.removeEventListener("openContextMenu", handleOpenContextMenu);
});
</script>
