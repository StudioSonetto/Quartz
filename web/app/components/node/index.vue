<template>
  <li class="node" role="none" :data-node-type="props.node.type">
    <button
      :id="`node-${props.node.id}`"
      role="treeitem"
      :aria-selected="isSelected"
      :aria-expanded="props.node.children.length ? isOpen : undefined"
      :class="{ selected: isSelected, hovering: isHovering }"
      @click="onSelect(props.node, $event)"
      @dblclick="toggleGroup"
    >
      <div class="flex items-center w-full">
        <div
          :class="[nodeIcon, { '-rotate-90': isGroup && !isOpen }]"
          class="flex-shrink-0 transition-transform"
        ></div>
        <input
          maxlength="30"
          @keydown.enter.esc.prevent="($event.target as HTMLInputElement).blur()"
          v-model.lazy="nodeName"
          :style="isSelected ? 'width: 100%' : `width: ${nodeName.length}ch`"
          :class="{ 'text-dark-900': isSelected }"
          class="name"
        />
      </div>
      <p
        v-if="props.node.reference"
        :class="{
          'opacity-0!': !isSelected,
        }"
        class="reference"
      >
        {{ props.node.reference }}
      </p>
    </button>
    <ul
      ref="nested"
      v-if="node.children"
      v-show="isOpen"
      role="group"
      :data-type="node.type"
    >
      <Node
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        @keydown.delete.stop="handleDelete"
        @contextmenu.prevent="
          useContextMenu().open($event, [
            {
              label: 'Delete',
              icon: 'i-carbon-trash-can',
              shortcut: '⌫',
              danger: true,
              action: () => {
                run('core.node.delete');
              },
            },
          ])
        "
      />
    </ul>
  </li>
</template>

<style scoped lang="postcss">
.node {
  button {
    @apply flex items-center justify-between;
    @apply w-full px-2 py-2 mb-3 border-rd relative;
    @apply ui-text-3 text-light-200 transition-colors cursor-pointer;

    div p,
    [class*="i-"] {
      @apply pointer-events-none;
    }

    div [class*="i-"] {
      @apply ui-text-4 mr-2.5;
    }

    .name {
      @apply p-0 border-none bg-transparent cursor-pointer;
      @apply ui-text-3 text-nowrap;
    }

    .reference {
      @apply ui-text-3;
      @apply italic mx-2 opacity-60;
      @apply transition-opacity;
    }

    &:hover:not(.selected),
    &.hovering:not(.selected) {
      @apply bg-light-200/5;

      div [class*="i-"] {
        @apply opacity-100;
      }

      .reference {
        @apply opacity-60;
      }
    }

    &.selected {
      @apply bg-light-200 text-dark-900;

      .name {
        @apply text-dark-900;
      }

      .reference {
        @apply text-dark-900 opacity-100;
      }
    }
  }

  ul {
    @apply list-none ml-6;
  }
}
</style>

<script setup lang="ts">
import { useDraggable } from "vue-draggable-plus";

import { getNodeType, canContain } from "~/modules/registry";
import { isEditableTarget } from "~/utils/dom";

const { updateNode, reorderNodes } = useDeckStore();
const { run } = useCommands();
const { isSelected: isNodeSelected } = useDeckStore();
const atelier = useAtelierStore();
const { highlightedNodeId } = storeToRefs(atelier);
const { select, toggle, range } = useNodeSelection();

const props = defineProps<{
  node: Tree;
}>();

const nodeName = computed({
  get() {
    return props.node.name;
  },
  set(value) {
    if (value.length > 30 || !value.length) return;

    updateNode(props.node.id, { name: value });
  },
});

const nodeIcon = computed(
  () => getNodeType(props.node.type)?.icon ?? "i-carbon-help",
);

const isSelected = computed(() => isNodeSelected(props.node.id));
const isGroup = computed(() => {
  return props.node.type === "core.group";
});
const isOpen = computed(() => !atelier.isCollapsed(props.node.id));
const isHovering = computed(() => highlightedNodeId.value === props.node.id);

const nested = ref<HTMLUListElement>();

const children = computed({
  get: () => props.node.children,
  set: (value) => {
    props.node.children = value;
  },
});

useDraggable(nested, children, {
  group: {
    name: "nodes",
    put: (_to, _from, dragEl) =>
      canContain(
        (nested.value?.dataset.type as NodeType) ?? "core.group",
        dragEl.dataset.nodeType as NodeType,
      ),
  },
  animation: 200,
  clone: (node: Tree) =>
    JSON.parse(
      JSON.stringify(node, (key, value) =>
        key === "parent" ? undefined : value,
      ),
    ),
  onEnd: () => reorderNodes(),
});

function onSelect(node: Tree, event: MouseEvent) {
  if (event.shiftKey) return range(node);
  if (event.metaKey || event.ctrlKey) return toggle(node);
  select(node, { handOffFocus: !isEditableTarget(event.target) });
}

function toggleGroup() {
  if (!props.node.children.length) return;

  atelier.toggleCollapsed(props.node.id);
}

// Route through the command so the delete guard (`core.node.delete`'s `when`)
// stays single-sourced — the row must not delete on rules the command wouldn't.
// The Backspace guard stays local: it protects the inline rename input, where
// Backspace edits text rather than deleting the node.
function handleDelete(event: KeyboardEvent) {
  if (event.key === "Backspace") return;

  run("core.node.delete");
}
</script>
