<template>
  <div ref="root" class="component-list">
    <div class="component-list-entries">
      <slot />
      <p v-if="!props.count" class="component-list-empty">none</p>
    </div>
    <div class="component-list-footer">
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
}>();

const emit = defineEmits<{
  add: [];
  remove: [index: number];
  select: [index: number];
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
