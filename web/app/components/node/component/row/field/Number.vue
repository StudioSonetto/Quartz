<template>
  <div class="field">
    <input
      type="text"
      inputmode="decimal"
      class="disabled:opacity-40 disabled:cursor-not-allowed"
      :class="{ 'cursor-ew-resize': dragging }"
      ref="input"
      :value="draft"
      :disabled="props.disabled"
      :placeholder="props.value === undefined ? 'Mixed' : undefined"
      @input="onInput"
      @change="flush"
      @keydown.escape="reset"
      @keydown.up.prevent="nudge($event, 1)"
      @keydown.down.prevent="nudge($event, -1)"
      @pointerdown="onPointerDown"
    />
  </div>
</template>

<script setup lang="ts">
import { clamp } from "@vueuse/core";

const props = withDefaults(
  defineProps<{
    value?: string | number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
  }>(),
  { min: -Infinity, max: Infinity, step: 1 },
);

const emit = defineEmits<{
  "update:value": [value: number];
}>();

const { start } = usePointerDrag();
const gesture = useHistoryGesture("Drag value");
const input = ref<HTMLInputElement | null>(null);
const shown = () => String(props.value ?? "");
const draft = ref(shown());
const dragging = ref(false);

watch(
  () => props.value,
  () => document.activeElement !== input.value && reset(),
);

function reset() {
  draft.value = shown();
}

function calculate(text: string) {
  const number = Number(text);

  if (text.trim() && Number.isFinite(number)) return number;

  const ast = parse(text);
  const value = isParseError(ast)
    ? NaN
    : evaluate(ast, { variable: () => undefined, builtin: () => undefined });

  return typeof value === "number" ? value : NaN;
}

function fit(value: number) {
  return +clamp(value, props.min, props.max).toFixed(6);
}

function stepSize(event: { shiftKey: boolean }) {
  return props.step * (event.shiftKey ? 10 : 1);
}

async function commit(value: number) {
  value = fit(value);

  if (Number.isFinite(value) && value !== Number(props.value))
    emit("update:value", value);

  await nextTick();

  reset();
}

function flush() {
  if (draft.value !== shown()) commit(calculate(draft.value));
}

function onInput(event: Event) {
  draft.value = (event.target as HTMLInputElement).value;

  const value = Number(draft.value);

  if (draft.value.trim() && value === fit(value) && value !== props.value)
    emit("update:value", value);
}

function nudge(event: KeyboardEvent, direction: number) {
  commit((calculate(draft.value) || 0) + direction * stepSize(event));
}

onBeforeUnmount(flush);

function onPointerDown(event: PointerEvent) {
  let value = Number(props.value);

  if (
    event.button ||
    props.disabled ||
    document.activeElement === input.value ||
    !Number.isFinite(value)
  )
    return;

  event.preventDefault();

  let last: number | null = null;

  start(
    null,
    (ev) => {
      if (last === null) {
        if (Math.abs(ev.clientX - event.clientX) < 3) return;

        last = ev.clientX;
        dragging.value = true;
        input.value?.setPointerCapture(event.pointerId);
        gesture.start();
      }

      if (ev.clientX === last) return;

      value = fit(value + (ev.clientX - last) * stepSize(ev));
      last = ev.clientX;

      commit(Math.round(value / props.step) * props.step);
    },
    () => {
      dragging.value = false;

      if (last !== null) return gesture.stop();

      input.value?.focus();
      input.value?.select();
    },
  );
}
</script>
