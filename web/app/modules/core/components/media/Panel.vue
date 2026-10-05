<template>
  <NodeComponent name="media" :icon="props.icon" :components="props.components">
    <NodeComponentRow name="asset" path="src" v-slot="{ value }">
      <NodeComponentRowFieldSelect
        :options="['', ...mediaNames]"
        :value="value"
        @update:value="setAsset"
      />
    </NodeComponentRow>
    <NodeComponentRow name="fit" path="fit" v-slot="{ value, update }">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'cover', icon: 'i-carbon-fit-to-screen' },
          { value: 'contain', icon: 'i-carbon-center-square' },
          { value: 'fill', icon: 'i-carbon-maximize' },
        ]"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="border radius"
      path="borderRadius"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber
        :min="0"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentRow
      name="opacity"
      path="opacity"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber
        :step="0.01"
        :min="0"
        :max="1"
        :value="value"
        @update:value="update"
      />
    </NodeComponentRow>
    <NodeComponentMediaRows v-if="isVideo" />
  </NodeComponent>
</template>

<script setup lang="ts">
import { applyMediaAsset } from "./apply";

const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { mediaNames } = storeToRefs(useAssetsStore());

const isVideo = computed(() =>
  props.components.every((c) => assetKind(c.data.src ?? "") === "video"),
);

const setAsset = (name: string) =>
  applyMediaAsset(
    props.nodes.map((n) => n.id),
    name,
  );
</script>
