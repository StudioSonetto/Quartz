<template>
  <div ref="root" class="component-list">
    <div class="component-list-entries">
      <slot />
      <p v-if="!props.count" class="component-list-empty">none</p>
    </div>
    <div class="component-list-footer">
      <template v-if="props.movable">
        <UIButton
          variant="icon"
          title="Move up"
          :disabled="!selected"
          @click="move(-1)"
        >
          <div class="i-carbon-arrow-up"></div>
        </UIButton>
        <UIButton
          variant="icon"
          title="Move down"
          :disabled="selected === null || selected === props.count - 1"
          @click="move(1)"
        >
          <div class="i-carbon-arrow-down"></div>
        </UIButton>
      </template>
      <UIButton variant="icon" title="Add" @click="add">
        <div class="i-carbon-add"></div>
      </UIButton>
      <UIButton
        variant="icon"
        title="Remove"
        :disabled="selected === null"
        @click="remove"
      >
        <div class="i-carbon-subtract"></div>
      </UIButton>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.component-list {
  @apply flex flex-col w-full ui-text-3;

  .component-list-entries {
    @apply flex flex-col gap-3;
  }

  .component-list-empty {
    @apply m-0 opacity-60;
  }

  .component-list-footer {
    @apply flex justify-end gap-1 mt-6;
  }
}
</style>

<script setup lang="ts">
const props = defineProps<{
  count: number;
  movable?: boolean;
}>();

const emit = defineEmits<{
  add: [];
  remove: [index: number];
  select: [index: number];
  move: [from: number, to: number];
}>();

const selected = ref<number | null>(null);
const open = ref(new Set<number>());

function select(index: number) {
  selected.value = index;
  emit("select", index);
}

function toggle(index: number) {
  if (open.value.has(index)) open.value.delete(index);
  else open.value.add(index);
}

provideComponentList({ selected, open, select, toggle });

const root = useTemplateRef<HTMLElement>("root");

onClickOutside(root, () => {
  selected.value = null;
});

function add() {
  const index = props.count;

  emit("add");

  selected.value = index;
  open.value.add(index);
}

function move(by: number) {
  const from = selected.value;
  const to = (from ?? -1) + by;

  if (from === null || from >= props.count || to < 0 || to >= props.count)
    return;

  emit("move", from, to);

  open.value = new Set(
    [...open.value].map((i) => (i === from ? to : i === to ? from : i)),
  );
  selected.value = to;
}

function remove() {
  const index = selected.value;

  if (index === null) return;

  emit("remove", index);

  const next = new Set<number>();

  for (const i of open.value) {
    if (i === index) continue;

    next.add(i > index ? i - 1 : i);
  }

  open.value = next;
  selected.value = null;
}
</script>
