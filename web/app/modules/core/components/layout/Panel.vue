<template>
  <NodeComponent name="layout" :icon="props.icon">
    <NodeComponentRow name="mode">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'free', icon: 'i-carbon-move' },
          { value: 'grid', icon: 'i-carbon-grid' },
        ]"
        v-model:value="props.component.data.mode"
      />
    </NodeComponentRow>
    <NodeComponentRow name="background">
      <NodeComponentRowFieldColour
        v-model:value="props.component.data.background"
      />
    </NodeComponentRow>
    <NodeComponentRow name="padding">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.padding"
      />
    </NodeComponentRow>
    <NodeComponentRow name="columns">
      <NodeComponentRowFieldNumber
        v-model:value="props.component.data.columns"
      />
    </NodeComponentRow>
    <NodeComponentRow name="gap">
      <NodeComponentRowFieldNumber v-model:value="props.component.data.gap" />
    </NodeComponentRow>
    <NodeComponentRow name="align">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'start', icon: 'i-carbon-align-vertical-top' },
          { value: 'center', icon: 'i-carbon-align-vertical-center' },
          { value: 'end', icon: 'i-carbon-align-vertical-bottom' },
        ]"
        v-model:value="props.component.data.align"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const { updateComponent } = useDeckStore();

const props = defineProps<{
  component: ComponentModel;
  icon: string;
}>();

watch(props.component.data, () => {
  updateComponent(props.component);
});
</script>
