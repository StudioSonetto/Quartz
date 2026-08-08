<template>
  <NodeComponent name="image" :icon="props.icon">
    <NodeComponentRow name="asset">
      <NodeComponentRowFieldSelect
        :options="['', ...imageNames]"
        :value="field(['src'])"
        @update:value="setAsset"
      />
    </NodeComponentRow>
    <NodeComponentRow name="fit">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'cover', icon: 'i-carbon-fit-to-screen' },
          { value: 'contain', icon: 'i-carbon-center-square' },
          { value: 'fill', icon: 'i-carbon-maximize' },
        ]"
        :value="field(['fit'])"
        @update:value="(v) => set(['fit'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="border radius">
      <NodeComponentRowFieldNumber
        :value="field(['borderRadius'])"
        @update:value="(v) => set(['borderRadius'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="opacity">
      <NodeComponentRowFieldNumber
        :value="field(['opacity'])"
        @update:value="(v) => set(['opacity'], v)"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
import { applyImageAsset } from "./apply";

const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const { field, set } = useMergedFields(() => props.components);
const { imageNames } = storeToRefs(useAssetsStore());

const setAsset = (name: string) =>
  applyImageAsset(
    props.nodes.map((n) => n.id),
    name,
  );
</script>
