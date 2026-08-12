<template>
  <div v-if="component" ref="editor" class="variables-editor">
    <div class="variables-list">
      <VariableEntry
        v-for="(entry, index) in list"
        :key="index"
        :entry="entry"
        :problem="problems.get(index)"
        :scope="scope"
        :selected="selected === index"
        :open="open.has(index)"
        @select="selected = index"
        @toggle="toggle(index)"
        @rename="(to) => renameVariable(index, to)"
        @patch="(changes) => patch(index, changes)"
      />
      <p v-if="!list.length" class="variables-empty">none</p>
    </div>
    <div class="variables-footer">
      <UIButton variant="icon" @click="add">
        <div class="i-carbon-add"></div>
      </UIButton>
      <UIButton
        variant="icon"
        :disabled="selected === null"
        @click="removeSelected"
      >
        <div class="i-carbon-subtract"></div>
      </UIButton>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.variables-editor {
  @apply flex flex-col w-full ui-text-3;

  .variables-list {
    @apply flex flex-col gap-3;
  }

  .variables-empty {
    @apply m-0 opacity-60;
  }

  .variables-footer {
    @apply flex justify-end gap-1 mt-6;
  }
}
</style>

<script setup lang="ts">
// Not auto-imported: Nuxt only scans `app/components/`, not `app/modules/`.
import VariableEntry from "./VariableEntry.vue";

const props = defineProps<{
  components: ComponentModel[];
}>();

const deck = useDeckStore();
const { updateComponent } = deck;
const { scopeFor } = useVariableScope();

const component = computed(() =>
  props.components.length === 1 ? props.components[0] : undefined,
);

const list = computed<VariableDef[]>(() => {
  const value = component.value?.data.variables;

  return Array.isArray(value) ? value : [];
});

const problems = computed(() => variableProblems(list.value));

const scope = computed(() => {
  const owner = component.value;
  const node = owner ? deck.getNodeAsTree(owner.node) : undefined;

  return node ? scopeFor(node) : undefined;
});

const selected = ref<number | null>(null);
const open = ref(new Set<number>());

watch(
  () => component.value?.node,
  () => {
    selected.value = null;
    open.value = new Set();
  },
);

const editor = useTemplateRef<HTMLElement>("editor");

onClickOutside(editor, () => {
  selected.value = null;
});

function toggle(index: number) {
  if (open.value.has(index)) open.value.delete(index);
  else open.value.add(index);
}

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

  const byNode = new Map<string, ComponentModel[]>();

  for (const c of deck.currentComponents ?? []) {
    const bucket = byNode.get(c.node);

    if (bucket) bucket.push(c);
    else byNode.set(c.node, [c]);
  }

  const scoped = flattenTree(subtree).flatMap(
    (node) => byNode.get(node.id) ?? [],
  );

  for (const updated of renameAcross(scoped, from, to)) {
    updateComponent(updated);
  }
}

function removeSelected() {
  const index = selected.value;

  if (index === null) return;

  write(list.value.filter((_, i) => i !== index));

  const next = new Set<number>();

  for (const i of open.value) {
    if (i === index) continue;

    next.add(i > index ? i - 1 : i);
  }

  open.value = next;
  selected.value = null;
}

function add() {
  const index = list.value.length;

  write([...list.value, { name: "", kind: "colour", expression: "#151515" }]);

  selected.value = index;
  open.value.add(index);
}
</script>
