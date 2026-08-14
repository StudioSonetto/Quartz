<template>
  <NodeComponent name="event" :icon="props.icon" :components="props.components">
    <NodeComponentRow name="handlers">
      <div v-if="component" class="events-editor">
        <div class="events-list">
          <div
            v-for="(handler, index) in handlers"
            :key="index"
            class="events-entry"
            @contextmenu.prevent="openMenu($event, index)"
          >
            <div class="events-field">
              <span>on</span>
              <NodeComponentRowFieldSelect
                :options="EVENT_TRIGGERS"
                :value="handler.on"
                @update:value="
                  (on: string) => patch(index, { on: on as EventTrigger })
                "
              />
            </div>
            <div v-if="handler.on === 'key'" class="events-field">
              <span>key</span>
              <NodeComponentRowFieldText
                :value="handler.key"
                :maxlength="12"
                lazy
                @update:value="(key: string) => patch(index, { key })"
              />
            </div>
            <div class="events-field">
              <span>do</span>
              <NodeComponentRowFieldSelect
                :options="EVENT_ACTIONS"
                :value="handler.action"
                @update:value="
                  (action: string) =>
                    patch(index, { action: action as EventAction })
                "
              />
            </div>
            <div v-if="isStateAction(handler.action)" class="events-field">
              <span>state</span>
              <NodeComponentRowFieldDropdown
                :options="stateNames"
                :value="handler.state"
                @update:value="(state: string) => patch(index, { state })"
              />
            </div>
            <div v-if="handler.action === 'goToSlide'" class="events-field">
              <span>slide</span>
              <NodeComponentRowFieldNumber
                :value="handler.slide ?? 0"
                :min="0"
                @update:value="(slide: number) => patch(index, { slide })"
              />
            </div>
          </div>
          <p v-if="!handlers.length" class="events-empty">none</p>
        </div>
        <p class="events-note">
          enter fires on every node when the slide is shown. Key names are
          lowercase, like arrowright or mod+k.
        </p>
        <div class="events-footer">
          <UIButton variant="icon" title="Add handler" @click="add">
            <div class="i-carbon-add"></div>
          </UIButton>
        </div>
      </div>
      <p v-else class="events-empty">Select one node to edit handlers.</p>
    </NodeComponentRow>
  </NodeComponent>
</template>

<style scoped lang="postcss">
.events-editor {
  @apply flex flex-col w-full ui-text-3;

  .events-list {
    @apply flex flex-col gap-4;
  }

  .events-entry {
    @apply flex flex-col gap-2;

    &:not(:last-child) {
      @apply pb-4 border-solid border-0 border-b-1 border-dark-200;
    }
  }

  .events-field {
    @apply flex items-center gap-3;

    span {
      @apply w-12 opacity-60;
    }
  }

  .events-note {
    @apply m-0 mt-4 opacity-60;
  }

  .events-footer {
    @apply flex justify-end gap-1 mt-4;
  }
}

.events-empty {
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
const { getNodeComponent } = useNodeComponents();

const component = computed(() =>
  props.components.length === 1 ? props.components[0] : undefined,
);

const handlers = computed<EventHandler[]>(() => {
  const value = component.value?.data?.handlers;

  return Array.isArray(value) ? value : [];
});

// An empty state name is the base state, so the field stays free-text and only
// suggests the states this node actually defines.
const stateNames = computed(() => {
  const node = component.value?.node;
  const anim = node
    ? getNodeComponent(node, "core.animation")?.data
    : undefined;

  return Object.keys(anim?.states ?? {});
});

const isStateAction = (action: string) =>
  action === "setState" || action === "toggleState";

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
  write([...handlers.value, { on: "click", action: "toggleState", state: "" }]);
}

function openMenu(event: MouseEvent, index: number) {
  useContextMenu().open(event, [
    {
      label: "Remove",
      icon: "i-carbon-trash-can",
      danger: true,
      action: () => write(handlers.value.filter((_, i) => i !== index)),
    },
  ]);
}
</script>
