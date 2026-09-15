<template>
  <NodeComponentList
    v-if="component"
    :key="component.node"
    :count="names.length"
    @add="add"
    @remove="remove"
    @select="pick"
  >
    <StateEntry
      v-for="(name, index) in names"
      :key="name"
      :index="index"
      :name="name"
      :state="states[name]!"
      :active="activeState(component.node) === name"
      @rename="(to) => rename(name, to)"
      @patch="(changes) => patch(name, changes)"
    />
  </NodeComponentList>
</template>

<script setup lang="ts">
// Not auto-imported:
import StateEntry from "./StateEntry.vue";

const props = defineProps<{
  components: ComponentModel[];
}>();

const PREVIEW_DURATION = 200;

const deck = useDeckStore();
const { updateComponent } = deck;
const { getNodeComponents } = useNodeComponents();
const { activeState, setState, toggleState } = useAnimationState();

const component = computed(() =>
  props.components.length === 1 ? props.components[0] : undefined,
);

const states = computed<Record<string, any>>(
  () => component.value?.data?.states ?? {},
);

const names = computed(() => Object.keys(states.value));

function write(next: Record<string, any>) {
  const target = component.value;

  if (!target) return;

  updateComponent({ ...target, data: { ...target.data, states: next } });
}

function add() {
  const target = component.value;

  if (!target) return;

  let n = 1;
  while (states.value[`state-${n}`]) n++;

  const overrides: Record<string, any> = {};

  for (const c of getNodeComponents(target.node)) {
    if (isStateless(c.type)) continue;

    overrides[c.type] = JSON.parse(JSON.stringify(c.data));
  }

  write({
    ...states.value,
    [`state-${n}`]: { easing: DEFAULT_STATE_EASING, overrides },
  });
}

function remove(index: number) {
  const target = component.value;
  const name = names.value[index];

  if (!target || !name) return;

  if (activeState(target.node) === name) setState(target.node, BASE_STATE);

  const { [name]: _removed, ...rest } = states.value;

  write(rest);

  for (const updated of renameState(
    deck.componentsOf(target.node),
    name,
    BASE_STATE,
  )) {
    updateComponent(updated);
  }
}

function patch(name: string, changes: Record<string, any>) {
  write({ ...states.value, [name]: { ...states.value[name], ...changes } });
}

function rename(from: string, to: string) {
  const target = component.value;

  if (!target || !to || to === from || states.value[to]) return;

  if (activeState(target.node) === from) setState(target.node, to);

  for (const updated of renameState(deck.componentsOf(target.node), from, to)) {
    updateComponent(updated);
  }
}

function pick(index: number) {
  const target = component.value;
  const name = names.value[index];

  if (!target || !name) return;

  // A preview has no handler to take a duration from, so it gets its own.
  toggleState(target.node, name, {
    ...stateTiming(target.data, name),
    duration: PREVIEW_DURATION,
  });
}
</script>
