<template>
  <NodeComponentList
    v-if="component"
    :key="component.node"
    :count="list.length"
    @add="add"
    @remove="remove"
  >
    <VariableEntry
      v-for="(entry, index) in list"
      :key="index"
      :index="index"
      :entry="entry"
      :problem="problems.get(index)"
      :scope="scope"
      @rename="(to) => renameVariable(index, to)"
      @patch="(changes) => patch(index, changes)"
    />
  </NodeComponentList>
</template>

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

function remove(index: number) {
  write(list.value.filter((_, i) => i !== index));
}

function add() {
  write([...list.value, { name: "", kind: "colour", expression: "#151515" }]);
}
</script>
