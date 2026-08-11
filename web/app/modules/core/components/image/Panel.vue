<template>
  <NodeComponent name="image" :icon="props.icon" :components="props.components">
    <NodeComponentRow name="asset" path="src" v-slot="{ value }">
      <NodeComponentRowFieldSelect
        :options="['', ...imageNames]"
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
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
    </NodeComponentRow>
    <NodeComponentRow
      name="opacity"
      path="opacity"
      kind="number"
      v-slot="{ value, update }"
    >
      <NodeComponentRowFieldNumber :value="value" @update:value="update" />
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

const { imageNames } = storeToRefs(useAssetsStore());

const setAsset = (name: string) =>
  applyImageAsset(
    props.nodes.map((n) => n.id),
    name,
  );
</script>
