<template>
  <li class="node">
    <button
      :class="{ selected: isSelected }"
      @click="selectNode(props.node)"
      @dblclick="toggleGroup"
    >
      <div class="flex items-center w-full">
        <div :class="[nodeIcon, { '-rotate-90': isGroup && !isOpen }]" class="flex-shrink-0 transition-transform"></div>
        <input
          maxlength="30"
          @keydown.enter.esc="($event.target as HTMLInputElement).blur()"
          @click="selectNode(props.node)"
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
    <ul ref="nested" v-if="node.children && isMounted" v-show="isOpen">
      <Node
        v-for="child in node.children"
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
                deleteSelectedNode();
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

    &:hover:not(.selected) {
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

      div [class*="i-"] {
        @apply opacity-100 text-accent;
      }

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
import Sortable from "sortablejs";

const { deleteSelectedNode, updateNode } = useDeckStore();
const { selectedNode } = storeToRefs(useDeckStore());

const props = defineProps<{
  node: Tree;
}>();

const isMounted = ref(false);

const nodeName = computed({
  get() {
    return props.node.name;
  },
  set(value) {
    if (value.length > 30 || !value.length) return;

    updateNode({
      ...props.node,
      name: value,
    });
  },
});

const nodeIcon = computed(() => {
  switch (props.node.type) {
    case "group":
      return "i-carbon-caret-down";

    case "text":
      return "i-carbon-text-short-paragraph";

    case "webgl_canvas":
      return "i-carbon-assembly-cluster";

    case "webgl_object":
      return "i-carbon-cube";
  }
});

const isSelected = computed(() => {
  return selectedNode.value?.id === props.node.id;
});
const isGroup = computed(() => {
  return props.node.type === "group";
});

const nested = ref<HTMLUListElement>();
const isOpen = ref(true);

function selectNode(node: Tree) {
  selectedNode.value = node;
}

function toggleGroup() {
  if (!isGroup.value) return;

  isOpen.value = !isOpen.value;
}

function handleDelete(event: KeyboardEvent) {
  if (event.key === "Backspace") return;

  deleteSelectedNode();
}

onMounted(() => {
  isMounted.value = true;

  if (!nested.value) return;

  Sortable.create(nested.value, {
    animation: 200,
    easing: "cubic-bezier(1, 0, 0, 1)",
  });
});
</script>
