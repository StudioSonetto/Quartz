<template>
  <NodeComponent
    name="animation"
    :icon="props.icon"
    :components="props.components"
  >
    <NodeComponentRow name="states">
      <NodeComponentList
        v-if="component"
        :key="component.node"
        :count="stateNames.length"
        @add="addState"
        @remove="removeState"
        @select="pick"
      >
        <NodeComponentListEntry
          v-for="(name, index) in stateNames"
          :key="name"
          :index="index"
          :name="name"
          :active="activeState(component.node) === name"
        />
      </NodeComponentList>
      <p v-else class="states-empty">Select one node to edit states.</p>
    </NodeComponentRow>
    <NodeComponentRow
      name="duration"
      path="duration"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="delay"
      path="delay"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="easing"
      path="easing"
      kind="string"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldSelect
        :options="EASING_OPTIONS"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="repeat"
      path="repeat"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="repeat type"
      path="repeatType"
      kind="string"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldSelect
        :options="REPEAT_TYPES"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<style scoped lang="postcss">
.states-empty {
  @apply m-0 opacity-60;
}
</style>

<script setup lang="ts">
const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { updateComponent } = useDeckStore();
const { getNodeComponents } = useNodeComponents();
const { activeState, setState, toggleState } = useAnimationState();

const component = computed(() =>
  props.components.length === 1 ? props.components[0] : undefined,
);

const states = computed<Record<string, any>>(
  () => component.value?.data?.states ?? {},
);

const stateNames = computed(() => Object.keys(states.value));

function write(next: Record<string, any>) {
  const target = component.value;

  if (!target) return;

  updateComponent({ ...target, data: { ...target.data, states: next } });
}

function addState() {
  const target = component.value;

  if (!target) return;

  let n = 1;
  while (states.value[`state-${n}`]) n++;

  const overrides: Record<string, any> = {};

  for (const c of getNodeComponents(target.node)) {
    if (isStateless(c.type)) continue;

    overrides[c.type] = JSON.parse(JSON.stringify(c.data));
  }

  write({ ...states.value, [`state-${n}`]: { overrides } });
}

function removeState(index: number) {
  const target = component.value;
  const name = stateNames.value[index];

  if (!target || !name) return;

  if (activeState(target.node) === name) setState(target.node, "");

  const { [name]: _, ...rest } = states.value;

  write(rest);
}

function pick(index: number) {
  const target = component.value;
  const name = stateNames.value[index];

  if (!target || !name) return;

  toggleState(target.node, name, target.data);
}
</script>
