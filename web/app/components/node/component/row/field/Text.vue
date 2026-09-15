<template>
  <div class="field">
    <div v-if="props.highlight && !focused" ref="mirror" class="text-mirror">
      <span>{{ draft.slice(0, props.highlight.start) }}</span
      ><mark ref="mark">{{
        draft.slice(props.highlight.start, props.highlight.end)
      }}</mark
      ><span>{{ draft.slice(props.highlight.end) }}</span>
    </div>
    <textarea
      ref="input"
      :class="{
        'cursor-not-allowed opacity-60': props.disabled,
      }"
      :disabled="props.disabled"
      @keydown.enter.exact.prevent="handleEnter"
      @keydown.escape="handleEscape"
      @scroll="syncScroll"
      @select="readSelection"
      @mouseup="readSelection"
      :rows="props.isParagraph ? 5 : 1"
      :maxlength="props.maxlength ?? (props.isParagraph ? 300 : 30)"
      :value="draft"
      :placeholder="props.value === undefined ? 'Mixed' : undefined"
      @input="onInput"
      @change="onChange"
    />
  </div>
</template>

<style scoped lang="postcss">
.field {
  @apply relative;
}

.text-mirror {
  @apply absolute w-auto! overflow-hidden pointer-events-none;
  @apply ui-text-3 whitespace-pre-wrap break-words text-transparent;
}

.text-mirror mark {
  @apply bg-accent text-transparent;
}

textarea {
  @apply relative z-1;
}
</style>

<script setup lang="ts">
const props = defineProps<{
  isParagraph?: boolean;
  value?: string;
  disabled?: boolean;
  maxlength?: number;
  lazy?: boolean;
  highlight?: { start: number; end: number } | null;
}>();

const emit = defineEmits<{
  "update:value": [value: string];
  "update:highlight": [range: { start: number; end: number } | null];
}>();

const draft = ref(props.value ?? "");
const input = ref<HTMLTextAreaElement | null>(null);
const mirror = ref<HTMLElement | null>(null);
const mark = ref<HTMLElement | null>(null);

const { focused } = useFocus(input);

watch(
  () => props.value,
  (value) => {
    draft.value = value ?? "";
  },
);

function syncScroll() {
  if (mirror.value && input.value)
    mirror.value.scrollTop = input.value.scrollTop;
}

function readSelection() {
  const field = input.value;

  if (!field || props.highlight === undefined) return;

  const { selectionStart: start, selectionEnd: end } = field;
  const range = start === end ? null : { start, end };

  if (
    range?.start === props.highlight?.start &&
    range?.end === props.highlight?.end
  )
    return;

  emit("update:highlight", range);
}

watch(
  [() => props.highlight, focused],
  async () => {
    await nextTick();

    const field = input.value;
    const target = mark.value;

    if (!field || !target) return;

    const { offsetTop, offsetHeight } = target;
    const hidden =
      offsetTop < field.scrollTop ||
      offsetTop + offsetHeight > field.scrollTop + field.clientHeight;

    if (hidden)
      field.scrollTop = offsetTop - (field.clientHeight - offsetHeight) / 2;

    if (mirror.value) mirror.value.scrollTop = field.scrollTop;
  },
  { flush: "post" },
);

let dirty = false;

function flush(): boolean {
  if (!dirty) return false;

  dirty = false;
  emit("update:value", draft.value);

  return true;
}

function onInput(event: Event) {
  draft.value = (event.target as HTMLTextAreaElement).value;

  if (props.lazy) {
    dirty = true;
    return;
  }

  emit("update:value", draft.value);
}

async function onChange() {
  if (!props.lazy || !flush()) return;

  await nextTick();

  draft.value = props.value ?? "";
}

function handleEscape(event: KeyboardEvent) {
  if (props.highlight) emit("update:highlight", null);

  if (!props.lazy || !dirty) return;

  event.preventDefault();
  dirty = false;
  draft.value = props.value ?? "";
}

onBeforeUnmount(() => {
  if (props.lazy) flush();
});

function handleEnter(event: KeyboardEvent) {
  const field = event.target as HTMLTextAreaElement;

  if (!props.isParagraph) {
    field.blur();
    return;
  }

  const at = field.selectionStart;

  draft.value = draft.value.slice(0, at) + "\n" + draft.value.slice(at);

  if (props.lazy) dirty = true;
  else emit("update:value", draft.value);

  nextTick(() => {
    field.selectionStart = field.selectionEnd = at + 1;
  });
}
</script>
