<template>
  <NodeComponent
    name="animation"
    :icon="props.icon"
    :components="props.components"
  >
    <NodeComponentRow name="states">
      <div v-if="component" class="states-editor">
        <div class="states-list">
          <UIButton
            v-for="name in stateNames"
            :key="name"
            variant="menu"
            :class="{ 'states-selected': activeState(component.node) === name }"
            @click="pick(name)"
            @contextmenu.prevent="openMenu($event, name)"
          >
            {{ name }}
          </UIButton>
          <p v-if="!stateNames.length" class="states-empty">none</p>
        </div>
        <div class="states-footer">
          <UIButton variant="icon" title="Add state" @click="addState">
            <div class="i-carbon-add"></div>
          </UIButton>
        </div>
      </div>
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
.states-editor {
  @apply flex flex-col w-full ui-text-3;

  .states-list {
    @apply flex flex-col gap-1;
  }

  .states-footer {
    @apply flex justify-end gap-1 mt-6;
  }
}

.states-selected {
  @apply text-accent;
}

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

function openMenu(event: MouseEvent, name: string) {
  useContextMenu().open(event, [
    {
      label: "Remove",
      icon: "i-carbon-trash-can",
      danger: true,
      action: () => removeState(name),
    },
  ]);
}

function removeState(name: string) {
  const target = component.value;

  if (!target) return;

  if (activeState(target.node) === name) setState(target.node, "");

  const { [name]: _, ...rest } = states.value;

  write(rest);
}

function pick(name: string) {
  const target = component.value;

  if (!target) return;

  toggleState(target.node, name, target.data);
}
</script>
