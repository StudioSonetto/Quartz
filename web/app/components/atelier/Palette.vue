<template>
  <!-- Not using Modal.vue because can't be called "easily" -->
  <div
    v-if="atelier.paletteOpen"
    class="palette-container"
    @click.self="atelier.closePalette()"
    @keydown.esc.prevent="atelier.closePalette()"
    @keydown.down.prevent="move(1)"
    @keydown.up.prevent="move(-1)"
    @keydown.enter.prevent="invokeActive()"
  >
    <div class="palette">
      <input
        ref="inputEl"
        v-model="query"
        class="palette-searchbar"
        placeholder="Type a command, @node, or :slide"
      />
      <ul class="palette-commands">
        <li v-if="!rows.length" class="p-3 opacity-50 ui-text-3">
          No matches.
        </li>
        <li
          v-for="row in rows"
          :key="row.key"
          class="flex items-center gap-2 p-3 cursor-pointer ui-text-3"
          :class="[
            !row.enabled && 'opacity-60 cursor-default',
            row.enabled &&
              selectableRows[activeIndex]?.key === row.key &&
              'bg-dark-500',
          ]"
          @mouseenter="
            row.enabled &&
            (activeIndex = selectableRows.findIndex((r) => r.key === row.key))
          "
          @click="row.invoke()"
        >
          <span v-if="row.icon" :class="row.icon" />
          <span class="flex-1">{{ row.title }}</span>
          <span v-if="row.category" class="opacity-40">{{ row.category }}</span>
          <kbd v-if="row.hint" class="opacity-60">{{ row.hint }}</kbd>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.palette-container {
  @apply fixed inset-0 z-50 bg-dark-900/60;
  @apply flex items-start pt-[25vh] justify-center;

  .palette {
    @apply w-[560px] max-w-[90vw] bg-dark-900 overflow-hidden;
    @apply border-solid border-2 border-dark-200 border-rd;

    .palette-searchbar {
      @apply w-full px-3 py-6 ui-text-3;
      @apply border-none!;
    }

    .palette-commands {
      @apply max-h-[20vh] overflow-y-auto;

      li {
        @apply transition-colors;
      }
    }
  }
}
</style>

<script setup lang="ts">
import { fuzzyFilter } from "~/utils/fuzzy";
import { comboForCommand } from "~/utils/keymap";
import { getNodeType } from "~/modules/registry";

import type { Tree } from "#shared/types";

const atelier = useAtelierStore();

const { enabledCommands, run } = useCommands();
const { nodeResults, slideResults, selectNode, goToSlide } = useQuickSearch();

const query = ref("");
const activeIndex = ref(0);
const inputEl = ref<HTMLInputElement | null>(null);

type Mode = "command" | "node" | "slide";

const mode = computed<Mode>(() => {
  if (query.value.startsWith("@")) return "node";
  if (query.value.startsWith(":")) return "slide";

  return "command";
});

const term = computed(() =>
  mode.value === "command" ? query.value.trim() : query.value.slice(1).trim(),
);

interface Row {
  key: string;
  title: string;
  icon?: string;
  hint?: string;
  category?: string;
  enabled: boolean;
  invoke: () => void;
}

const rows = computed<Row[]>(() => {
  if (mode.value === "node") {
    return nodeResults(term.value).map((n: Tree) => ({
      key: n.id,
      title: n.name || n.type,
      icon: getNodeType(n.type)?.icon,
      enabled: true,
      invoke: () => {
        atelier.closePalette();
        selectNode(n);
      },
    }));
  }
  if (mode.value === "slide") {
    return slideResults(term.value).map((i) => ({
      key: `slide-${i}`,
      title: `Slide ${i + 1}`,
      icon: "i-carbon-image",
      enabled: true,
      invoke: () => {
        atelier.closePalette();
        goToSlide(i);
      },
    }));
  }

  // command mode
  let list = enabledCommands.value;
  if (term.value === "" && atelier.recentCommands.length) {
    const order = new Map(atelier.recentCommands.map((id, i) => [id, i]));
    list = [...list].sort(
      (a, b) =>
        (order.get(a.command.id) ?? Infinity) -
        (order.get(b.command.id) ?? Infinity),
    );
  }
  const filtered = fuzzyFilter(list, term.value, (c) => c.command.title);
  return filtered.map(({ command, enabled }) => ({
    key: command.id,
    title: command.title,
    icon: command.icon,
    hint: comboForCommand(command.id),
    category: command.category,
    enabled,
    invoke: () => {
      if (!enabled) return;
      atelier.closePalette();
      run(command.id);
    },
  }));
});

const selectableRows = computed(() => rows.value.filter((r) => r.enabled));

watch([query, () => atelier.paletteOpen], () => {
  activeIndex.value = 0;
});

watch(
  () => atelier.paletteOpen,
  async (open) => {
    if (open) {
      query.value = "";
      await nextTick();
      inputEl.value?.focus();
    }
  },
);

function move(delta: number) {
  const n = selectableRows.value.length;

  if (!n) return;

  activeIndex.value = (activeIndex.value + delta + n) % n;
}

function invokeActive() {
  selectableRows.value[activeIndex.value]?.invoke();
}
</script>
