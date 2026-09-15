<template>
  <NodeComponent
    name="layout"
    :icon="props.icon"
    :components="props.components"
  >
    <NodeComponentRow name="mode">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'free', icon: 'i-carbon-move' },
          { value: 'grid', icon: 'i-carbon-grid' },
        ]"
        :value="field(['mode'])"
        @update:value="(v) => setMode(v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="direction">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'vertical', icon: 'i-carbon-arrow-down' },
          { value: 'horizontal', icon: 'i-carbon-arrow-right' },
        ]"
        :value="field(['direction'])"
        @update:value="(v) => set(['direction'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="background">
      <NodeComponentRowFieldRadio
        :options="backgroundOptions"
        :value="mixed ? undefined : background.type"
        @update:value="(v) => setBackgroundType(v)"
      />
    </NodeComponentRow>
    <NodeComponentRow
      v-if="!mixed && background.type === 'colour'"
      name="colour"
      path="background.value"
      kind="colour"
    >
      <NodeComponentRowFieldColour
        :value="background.value"
        @update:value="(v) => set(['background'], { type: 'colour', value: v })"
      />
    </NodeComponentRow>
    <NodeComponentRow v-if="!mixed && background.type === 'image'" name="image">
      <NodeComponentRowFieldSelect
        :options="imageOptions"
        :value="background.value"
        @update:value="(v) => set(['background'], { ...background, value: v })"
      />
    </NodeComponentRow>
    <NodeComponentRow v-if="!mixed && background.type === 'image'" name="fit">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'cover', icon: 'i-carbon-fit-to-screen' },
          { value: 'contain', icon: 'i-carbon-center-square' },
          { value: 'tile', icon: 'i-carbon-grid' },
        ]"
        :value="background.fit"
        @update:value="(v) => setFit(v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="padding">
      <NodeComponentRowFieldNumber
        :value="field(['padding'])"
        @update:value="(v) => set(['padding'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow
      v-if="field(['direction']) !== 'horizontal'"
      name="columns"
    >
      <NodeComponentRowFieldNumber
        :value="field(['columns'])"
        @update:value="(v) => set(['columns'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="gap">
      <NodeComponentRowFieldNumber
        :value="field(['gap'])"
        @update:value="(v) => set(['gap'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="align">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'start', icon: 'i-carbon-align-vertical-top' },
          { value: 'center', icon: 'i-carbon-align-vertical-center' },
          { value: 'end', icon: 'i-carbon-align-vertical-bottom' },
        ]"
        :value="field(['align'])"
        @update:value="(v) => set(['align'], v)"
      />
    </NodeComponentRow>
    <NodeComponentRow name="justify">
      <NodeComponentRowFieldRadio
        :options="[
          { value: 'start', icon: 'i-carbon-align-horizontal-left' },
          { value: 'center', icon: 'i-carbon-align-horizontal-center' },
          { value: 'end', icon: 'i-carbon-align-horizontal-right' },
        ]"
        :value="field(['justify'])"
        @update:value="(v) => set(['justify'], v)"
      />
    </NodeComponentRow>
  </NodeComponent>
</template>

<script setup lang="ts">
const props = defineProps<{
  components: ComponentModel[];
  nodes: Tree[];
  icon: string;
}>();

const DEFAULT_COLOUR = "#FAFAFA";

const { getNodeComponent } = useNodeComponents();
const { updateComponent } = useDeckStore();
const { field, set } = useMergedFields(() => props.components);
const { imageNames: imageOptions } = storeToRefs(useAssetsStore());

const hasRoot = computed(() => props.nodes.some((n) => n.path === ROOT_PATH));

const backgroundOptions = computed(() => [
  ...(hasRoot.value ? [] : [{ value: "none", icon: "i-carbon-error-outline" }]),
  { value: "colour", icon: "i-carbon-color-palette" },
  { value: "image", icon: "i-carbon-image" },
]);

const { mixed, paint: background } = usePaintField(
  () => props.components,
  field,
  "background",
);

const lastColour = ref(DEFAULT_COLOUR);
const lastImage = ref<{ value: string; fit: BackgroundFit }>({
  value: "",
  fit: "cover",
});

watch(
  () => props.nodes.map((n) => n.id).join(),
  () => {
    lastColour.value = DEFAULT_COLOUR;
    lastImage.value = { value: "", fit: "cover" };
  },
);

watch(
  background,
  (bg) => {
    if (bg.type === "colour") lastColour.value = bg.value;
    if (bg.type === "image") lastImage.value = { value: bg.value, fit: bg.fit };
  },
  { immediate: true },
);

function clearColourBinding() {
  for (const c of props.components) {
    if (!c.data?.[BIND_KEY]?.["background.value"]) continue;

    updateComponent({
      ...c,
      data: writeBind(c.data, "background.value", ""),
    });
  }
}

function setBackgroundType(next: string | string[]) {
  const type = one(next);

  if (type !== "colour") clearColourBinding();

  if (type === "colour") {
    set(["background"], { type: "colour", value: lastColour.value });
  } else if (type === "image") {
    const value = lastImage.value.value || imageOptions.value[0] || "";

    set(["background"], { type: "image", ...lastImage.value, value });
  } else {
    set(["background"], { type: "none" });
  }
}

function setFit(next: string | string[]) {
  set(["background"], { ...background.value, fit: one(next) });
}

function anchorGroupToChildren(group: Tree) {
  const transform = getNodeComponent(group.id, "core.transform");

  if (!transform) return;

  let minX = Infinity;
  let minY = Infinity;

  for (const child of group.children) {
    const ct = getNodeComponent(child.id, "core.transform");

    if (!ct) continue;

    minX = Math.min(minX, ct.data.position.x);
    minY = Math.min(minY, ct.data.position.y);
  }
  if (minX === Infinity) return;

  const data = setNested(
    setNested(transform.data, ["position", "x"], Math.round(minX)),
    ["position", "y"],

    Math.round(minY),
  );

  updateComponent({ ...transform, data });
}

function setMode(mode: string | string[]) {
  const next = one(mode);

  set(["mode"], next);

  if (next === "grid") {
    for (const n of props.nodes) {
      if (n.path === ROOT_PATH) continue;

      anchorGroupToChildren(n);
    }
  }
}
</script>
