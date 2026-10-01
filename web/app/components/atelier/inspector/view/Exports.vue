<template>
  <AtelierInspectorView name="Export">
    <div class="export-list">
      <UIButton variant="solid" :disabled="!!progress" @click="png">
        <div class="i-carbon-image"></div>
        PNG — current frame
      </UIButton>
      <div class="export-moment">
        <span class="ui-text-4">PDF pages at</span>
        <NodeComponentRowFieldRadio
          v-model:value="moment"
          :options="MOMENTS"
          :disabled="!!progress"
        />
      </div>
      <UIButton variant="solid" :disabled="!!progress" @click="pdf">
        <div class="i-carbon-document-pdf"></div>
        PDF — all slides
      </UIButton>
      <p v-if="progress" class="ui-text-4">Exporting {{ progress }}</p>
    </div>
  </AtelierInspectorView>
</template>

<style scoped lang="postcss">
.export-list {
  @apply flex flex-col gap-2;
}

.export-moment {
  @apply flex justify-between items-center;
}
</style>

<script setup lang="ts">
const MOMENTS = [
  { value: "start", icon: "i-carbon-skip-back", label: "Start of each slide" },
  { value: "end", icon: "i-carbon-skip-forward", label: "End of each slide" },
  { value: "keys", icon: "i-carbon-diamond-outline", label: "Every keyframe" },
];

const { png, pdf, progress, moment } = useExport();
</script>
