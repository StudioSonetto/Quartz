<template>
  <div v-if="component" class="variables-editor">
    <div v-for="(entry, index) in list" :key="index" class="variable-entry">
      <div class="variable-row">
        <NodeComponentRowFieldText
          lazy
          :value="entry.name"
          @update:value="(v) => renameVariable(index, v.trim())"
        />
        <NodeComponentRowFieldSelect
          :options="KINDS"
          :value="entry.kind"
          @update:value="(v) => patch(index, { kind: v as VariableKind })"
        />
        <NodeComponentRowFieldText
          lazy
          :value="entry.expression"
          @update:value="(v) => patch(index, { expression: v })"
        />
        <button type="button" class="variable-remove" @click="remove(index)">
          <div class="i-carbon-trash-can"></div>
        </button>
      </div>
      <p v-if="problems.get(index)" class="variable-problem">
        {{ problems.get(index) }}
      </p>
    </div>
    <button type="button" class="variable-add" @click="add">
      add variable
    </button>
  </div>
</template>

<style scoped lang="postcss">
.variables-editor {
  @apply flex flex-col gap-2 w-full;

  .variable-entry {
    @apply flex flex-col gap-1;
  }

  .variable-row {
    @apply flex gap-2 items-center;
  }

  .variable-problem {
    @apply ui-text-3 text-red-400;
  }

  .variable-remove,
  .variable-add {
    @apply bg-transparent border-none text-light-200 cursor-pointer ui-text-3;
  }
}
</style>

<script setup lang="ts">
const KINDS: VariableKind[] = ["colour", "number", "string", "font"];

const props = defineProps<{
  components: ComponentModel[];
}>();

const deck = useDeckStore();
const { updateComponent } = deck;

// Variables are per-node; merging lists across a multi-selection is meaningless.
const component = computed(() =>
  props.components.length === 1 ? props.components[0] : undefined,
);

const list = computed<VariableDef[]>(() => {
  const value = component.value?.data.variables;

  return Array.isArray(value) ? value : [];
});

const problems = computed(() => variableProblems(list.value));

function write(next: VariableDef[]) {
  const target = component.value;

  if (!target) return;

  updateComponent({ ...target, data: { ...target.data, variables: next } });
}

function patch(index: number, changes: Partial<VariableDef>) {
  write(
    list.value.map((entry, i) =>
      i === index ? { ...entry, ...changes } : entry,
    ),
  );
}

function renameVariable(index: number, to: string) {
  const from = list.value[index]?.name;
  const owner = component.value;

  patch(index, { name: to });

  if (!from || !to || from === to || !owner) return;

  const subtree = deck.getNodeAsTree(owner.node);

  if (!subtree) return;

  for (const node of flattenTree(subtree)) {
    for (const c of deck.componentsOf(node.id)) {
      let data = c.data;
      let changed = false;

      const bind = data?.[BIND_KEY] as Record<string, string> | undefined;

      if (bind) {
        const next = { ...bind };

        for (const [path, source] of Object.entries(bind)) {
          if (!usesVariable(source, from)) continue;

          next[path] = renameInSource(source, from, to);
          changed = true;
        }

        if (changed) data = { ...data, [BIND_KEY]: next };
      }

      // Variables further down the tree can derive from it too.
      if (c.type === "core.base" && Array.isArray(data.variables)) {
        const current = data.variables as VariableDef[];
        const renamed = current.map((entry) =>
          entry.name !== to && usesVariable(entry.expression, from)
            ? {
                ...entry,
                expression: renameInSource(entry.expression, from, to),
              }
            : entry,
        );

        if (renamed.some((entry, i) => entry !== current[i])) {
          data = { ...data, variables: renamed };
          changed = true;
        }
      }

      if (changed) updateComponent({ ...c, data });
    }
  }
}

function remove(index: number) {
  write(list.value.filter((_, i) => i !== index));
}

function add() {
  write([...list.value, { name: "", kind: "colour", expression: "#151515" }]);
}
</script>
