<template>
  <AtelierInspectorView name="Export">
    <fieldset class="export-card" :disabled="busy">
      <div class="export-row">
        <label>Format</label>
        <NodeComponentRowFieldRadio v-model:value="format" :options="FORMATS" />
      </div>

      <div v-if="format === 'png'" class="export-row">
        <label>Frame</label>
        <span>{{ frame }}</span>
      </div>

      <template v-else>
        <div class="export-row">
          <label>Pages at</label>
          <NodeComponentRowFieldRadio
            v-model:value="moment"
            :options="MOMENTS"
          />
        </div>
        <div class="export-row">
          <label>Slides</label>
          <span>{{ slides.length }}</span>
        </div>
      </template>

      <UIButton variant="solid" @click="format === 'png' ? png() : pdf()">
        {{
          busy ? `Exporting… ${progress}` : `Download ${format.toUpperCase()}`
        }}
      </UIButton>
    </fieldset>
  </AtelierInspectorView>
</template>

<style scoped lang="postcss">
.export-card {
  @apply relative flex flex-col gap-6 p-6 bg-dark-900;
  @apply border-solid border-0 border-b-2 border-dark-200;

  &::before {
    @apply absolute left-0 top-0 bottom-0 w-0.5;
    @apply bg-accent content-[''];
  }
}

.export-row {
  @apply flex items-center ui-text-3;

  label {
    @apply w-1/3;
  }

  span {
    @apply flex-1 ui-muted;
  }
}
</style>

<script setup lang="ts">
const FORMATS = [
  { value: "png", label: "PNG" },
  { value: "pdf", label: "PDF" },
];

const MOMENTS = [
  { value: "start", label: "Start" },
  { value: "end", label: "End" },
  { value: "keys", label: "Each Keyframe" },
];

const { png, pdf, busy, progress, moment, format, slides, shownTime, overrun } =
  useExport();
const { playing } = usePlayhead();

// Reading time only while paused stops playback re-rendering this every frame.
const frame = computed(() => {
  if (playing.value) return "Playing";

  return overrun.value ? "Looping" : formatSeconds(shownTime.value);
});
</script>
