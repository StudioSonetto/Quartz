<template>
  <AtelierInspectorView name="Properties" :actions="[]">
    <div
      v-if="selectedNodes.length"
      class="view"
      tabindex="-1"
      @keydown="onKeydown"
      @contextmenu.prevent
    >
      <template v-if="sameType">
        <template v-for="{ type, def } in typePanels" :key="type">
          <Component
            v-if="def"
            :is="def.inspector"
            :components="componentsByType.get(type) ?? []"
            :nodes="selectedNodes"
            :icon="def.icon"
          />
          <div v-else class="unavailable">
            Unavailable component: {{ type }}
          </div>
        </template>
      </template>
      <div v-else class="placeholder">
        <div class="i-carbon-error"></div>
        <p>Can't edit nodes of different types</p>
      </div>
    </div>
    <div v-else class="placeholder" @contextmenu.prevent>
      <div class="i-carbon-error"></div>
      <p>No nodes selected</p>
    </div>
  </AtelierInspectorView>
</template>

<style scoped lang="postcss">
.view,
.placeholder {
  @apply w-full h-full;
  @apply border-rd border-0;
  @apply bg-dark-800 text-light-200;
}

.view {
  @apply overflow-y-auto;

  &::-webkit-scrollbar {
    @apply hidden;
  }

  &:focus-visible {
    @apply outline-none;
  }
}

.placeholder {
  @apply flex flex-col justify-center items-center;
  @apply ui-text-3;

  .i-carbon-error {
    @apply ui-text-6 mb-6;
  }
}

.unavailable,
.hint {
  @apply p-6 ui-text-3 opacity-60 italic;
}
</style>

<script setup lang="ts">
const { selectedNodes } = storeToRefs(useDeckStore());
const { getNodeComponents } = useNodeComponents();

import { getComponentType } from "~/modules/registry";
import { isEditableTarget, wrapIndex } from "~/utils/dom";

const { clear } = useNodeSelection();

const sameType = computed(
  () => new Set(selectedNodes.value.map((n) => n.type)).size === 1,
);

// Homogeneous ⇒ every node has the same component set, so derive the panel list
// from the anchor (first selected) node.
const typePanels = computed(() => {
  const anchor = selectedNodes.value[0];
  if (!anchor) return [];
  return getNodeComponents(anchor.id).map((c) => ({
    type: c.type,
    def: getComponentType(c.type),
  }));
});

// One pass over the selection groups every component by type, so each panel's
// `:components` is a cached, stable array rather than an O(types × nodes) lookup
// recomputed per row on every render.
const componentsByType = computed(() => {
  const map = new Map<ComponentType, ComponentModel[]>();
  for (const node of selectedNodes.value) {
    for (const c of getNodeComponents(node.id)) {
      const list = map.get(c.type);
      if (list) list.push(c);
      else map.set(c.type, [c]);
    }
  }
  return map;
});

const FOCUSABLE = "button, input, select, textarea, [href], [tabindex]";

function getFocusables(view: HTMLElement): HTMLElement[] {
  return Array.from(view.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) =>
      !(el as HTMLButtonElement).disabled &&
      el.offsetParent !== null &&
      // Open component headers opt out of the tab order, so this keeps the
      // list in step with what native Tab would visit.
      el.tabIndex >= 0,
  );
}

function moveFocus(els: HTMLElement[], delta: number) {
  const i = els.indexOf(document.activeElement as HTMLElement);

  els[wrapIndex(i, delta, els.length)]?.focus();
}

function onKeydown(e: KeyboardEvent) {
  const view = e.currentTarget as HTMLElement;

  // Esc releases the selection outright rather than stepping back to the tree,
  // so deselecting is one press from here as well. Also means the wrapping
  // below can never trap keyboard users.
  if (e.key === "Escape") {
    // A field with an unsaved edit claims the first press to abandon it, so
    // deselecting takes a second one.
    if (e.defaultPrevented) return;

    e.preventDefault();
    clear();
    return;
  }

  // Left/Right are globally bound to slide navigation. While this panel holds
  // focus they belong to it, so claim them — otherwise editing a node's
  // properties and pressing Left jumps the deck to another slide.
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    if (isEditableTarget(e.target)) return;
    e.preventDefault();
    return;
  }

  const isArrow = e.key === "ArrowDown" || e.key === "ArrowUp";

  if (!isArrow && e.key !== "Tab") return;

  // Editable fields own their arrows — caret movement, and number inputs
  // stepping their value — so leave those alone.
  if (isArrow && isEditableTarget(e.target)) return;

  const els = getFocusables(view);

  if (!els.length) return;

  const dir = isArrow ? (e.key === "ArrowUp" ? -1 : 1) : e.shiftKey ? -1 : 1;

  // Tab already moves natively; we only step in to wrap it around the ends,
  // matching how the tree re-cycles nodes. Arrows always move.
  if (!isArrow && document.activeElement !== (dir > 0 ? els.at(-1) : els[0])) {
    return;
  }

  e.preventDefault();
  moveFocus(els, dir);
}
</script>
