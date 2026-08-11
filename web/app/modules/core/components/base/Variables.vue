<template>
  <div v-if="component" class="variables-editor">
    <div v-for="(entry, index) in list" :key="index" class="variable-entry">
      <div class="variable-row">
        <NodeComponentRowFieldText
          lazy
          :value="entry.name"
          @update:value="(v) => patch(index, { name: v.trim() })"
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

const { updateComponent } = useDeckStore();

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

function remove(index: number) {
  write(list.value.filter((_, i) => i !== index));
}

function add() {
  write([...list.value, { name: "", kind: "colour", expression: "#151515" }]);
}
</script>
