<template>
  <NodeComponent name="event" :icon="props.icon" :components="props.components">
    <NodeComponentRow name="handlers">
      <NodeComponentList
        v-if="component"
        :key="component.node"
        :count="handlers.length"
        @add="add"
        @remove="remove"
      >
        <NodeComponentListEntry
          v-for="(handler, index) in handlers"
          :key="index"
          :index="index"
          :name="title(handler)"
          :preview="summary(handler)"
        >
          <NodeComponentRow name="on">
            <NodeComponentRowFieldSelect
              :options="EVENT_TRIGGERS"
              :value="handler.on"
              @update:value="
                (on: string) => patch(index, { on: on as EventTrigger })
              "
            />
          </NodeComponentRow>
          <NodeComponentRow v-if="handler.on === 'key'" name="key">
            <NodeComponentRowFieldText
              lazy
              :value="handler.key"
              :maxlength="12"
              @update:value="(key: string) => patch(index, { key })"
            />
          </NodeComponentRow>
          <NodeComponentRow name="do">
            <NodeComponentRowFieldSelect
              :options="EVENT_ACTIONS"
              :value="handler.action"
              @update:value="
                (action: string) =>
                  patch(index, { action: action as EventAction })
              "
            />
          </NodeComponentRow>
          <NodeComponentRow v-if="isStateAction(handler.action)" name="state">
            <NodeComponentRowFieldDropdown
              :options="names"
              :value="handler.state"
              @update:value="(state: string) => patch(index, { state })"
            />
          </NodeComponentRow>
          <NodeComponentRow v-if="handler.action === 'seek'" name="time">
            <NodeComponentRowFieldNumber
              :value="handler.time ?? 0"
              :min="0"
              @update:value="(time: number) => patch(index, { time })"
            />
          </NodeComponentRow>
          <NodeComponentRow
            v-if="isStateAction(handler.action)"
            name="duration"
          >
            <NodeComponentRowFieldNumber
              :value="handler.duration ?? DEFAULT_HANDLER_DURATION"
              :min="0"
              @update:value="(duration: number) => patch(index, { duration })"
            />
          </NodeComponentRow>
          <NodeComponentRow v-if="handler.action === 'goToSlide'" name="slide">
            <NodeComponentRowFieldNumber
              :value="handler.slide ?? 0"
              :min="0"
              @update:value="(slide: number) => patch(index, { slide })"
            />
          </NodeComponentRow>
        </NodeComponentListEntry>
      </NodeComponentList>
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { updateComponent } = useDeckStore();
const { getNodeComponent } = useNodeComponents();

const component = computed(() =>
  props.components.length === 1 ? props.components[0] : undefined,
);

const handlers = computed<EventHandler[]>(() => {
  const value = component.value?.data?.handlers;

  return Array.isArray(value) ? value : [];
});

const names = computed(() => {
  const node = component.value?.node;

  return stateNames(node && getNodeComponent(node, "core.base")?.data);
});

const isStateAction = (action: string) =>
  action === "setState" || action === "toggleState";

const title = (handler: EventHandler) =>
  handler.on === "key" ? `key ${handler.key || "?"}` : handler.on;

function summary(handler: EventHandler) {
  if (handler.action === "goToSlide") return `goToSlide ${handler.slide ?? 0}`;
  if (handler.action === "seek")
    return `seek ${formatSeconds(handler.time ?? 0)}`;

  if (isStateAction(handler.action))
    return `${handler.action} ${handler.state || "base"}`;

  return handler.action;
}

function write(next: EventHandler[]) {
  const target = component.value;

  if (!target) return;

  updateComponent({ ...target, data: { ...target.data, handlers: next } });
}

function patch(index: number, changes: Partial<EventHandler>) {
  write(
    handlers.value.map((entry, i) =>
      i === index ? { ...entry, ...changes } : entry,
    ),
  );
}

function add() {
  write([
    ...handlers.value,
    {
      on: "click",
      action: "toggleState",
      state: "",
      duration: DEFAULT_HANDLER_DURATION,
    },
  ]);
}

function remove(index: number) {
  write(handlers.value.filter((_, i) => i !== index));
}
</script>
