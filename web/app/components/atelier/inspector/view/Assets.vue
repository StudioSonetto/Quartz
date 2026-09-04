<template>
  <AtelierInspectorView
    name="Assets"
    :actions="[
      {
        icon: 'i-carbon-cloud-upload',
        tooltip: 'Upload asset',
        onClick: () => open(),
      },
    ]"
  >
    <div ref="dropZone" class="asset-drop" :class="{ over: isOverDropZone }">
      <div ref="listEl" class="list" :style="{ height: `${layout.height}px` }">
        <div
          v-for="asset in placed"
          :key="asset.name"
          class="item"
          :style="layout.boxes[asset.name]"
          draggable="true"
          @dragstart="onDragStart($event, asset.name)"
          @dragend="assetDrag.end()"
          @contextmenu.prevent="
            useContextMenu().open($event, [
              {
                label: 'Delete',
                icon: 'i-carbon-trash-can',
                danger: true,
                action: () =>
                  currentSlides &&
                  deleteSelectedAsset(currentSlides.deck, asset),
              },
            ])
          "
        >
          <button
            v-if="store.isImage(asset.name)"
            @click="openImageModal(asset)"
          >
            <NuxtImg
              :src="asset.url"
              :alt="asset.name"
              @load="onImageLoad($event, asset.name)"
            />
          </button>
          <button
            v-else-if="store.isFont(asset.name)"
            class="px-3"
            @click="openFontModal(asset)"
          >
            <p>{{ asset.name }}</p>
          </button>
          <button
            v-else-if="store.isModel(asset.name)"
            @click="openModelModal(asset)"
          >
            <TresCanvas>
              <TresPerspectiveCamera :position="[0, 0, 2]" />
              <Suspense>
                <UseLoader
                  v-slot="{ data }"
                  :loader="loaderFor(asset.name) as any"
                  :url="asset.url"
                >
                  <primitive :object="previewObject(data)" />
                </UseLoader>
              </Suspense>
            </TresCanvas>
          </button>
          <button v-else>
            <p>Unsupported asset: {{ asset.name }}</p>
          </button>
        </div>
      </div>
    </div>
    <Modal
      ref="imagePreviewModal"
      :title="`${selectedAsset?.name}`"
      @close="closeModal"
    >
      <NuxtImg
        v-if="openModal === 'image' && selectedAsset"
        class="w-full h-full"
        @click="imagePreviewModal?.close()"
        :src="selectedAsset.url"
        alt="preview"
      />
    </Modal>
    <Modal
      ref="fontPreviewModal"
      :title="`${selectedAsset?.name}`"
      @close="closeModal"
    >
      <p
        v-if="openModal === 'font' && selectedAsset"
        class="text-3xl"
        :style="{ fontFamily: selectedAsset.name }"
      >
        A lazy fox jumps over the lazy dog.
      </p>
    </Modal>
    <Modal
      ref="modelPreviewModal"
      :title="`${selectedAsset?.name}`"
      @close="closeModal"
    >
      <div class="w-[50vh] h-[50vh]">
        <TresCanvas v-if="openModal === 'model' && selectedAsset">
          <TresPerspectiveCamera :position="[0, 0, 5]" />
          <Suspense>
            <UseLoader
              v-slot="{ data }"
              :loader="loaderFor(selectedAsset.name) as any"
              :url="selectedAsset?.url"
            >
              <primitive :object="previewObject(data)" />
            </UseLoader>
          </Suspense>
          <OrbitControls />
        </TresCanvas>
      </div>
    </Modal>
  </AtelierInspectorView>
</template>

<style scoped lang="postcss">
.asset-drop {
  @apply border-2 border-dashed border-transparent border-rd;
  @apply transition-colors;

  &.over {
    @apply border-accent bg-accent/10;
  }
}

.list {
  @apply relative;

  .item {
    @apply absolute;
    @apply border-solid border-1 border-rd;
    @apply border-dark-200 hover:border-light-200;
    @apply overflow-hidden transition-colors;

    button {
      @apply w-full h-full rounded-lg;
      @apply break-words;

      img {
        @apply w-full h-full object-cover block;
      }
    }
  }
}
</style>

<script setup lang="ts">
import { UseLoader } from "@tresjs/core";
import { BufferGeometry, Mesh, MeshNormalMaterial } from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

import type Modal from "@/components/Modal.vue";

const { currentSlides } = storeToRefs(useDeckStore());

const store = useAssetsStore();

const assetDrag = useAssetDrag();

const dropZone = useTemplateRef<HTMLElement>("dropZone");

const { isOverDropZone } = useDropZone(dropZone, {
  dataTypes: (types) => types.length > 0,
  onDrop: async (files) => {
    const deck = currentSlides.value?.deck;

    if (!files?.length || !deck) return;

    await uploadAssets(deck, files);
  },
});

function onDragStart(event: DragEvent, name: string) {
  event.dataTransfer?.setData(ASSET_MIME, name);
  event.dataTransfer!.effectAllowed = "copy";

  assetDrag.start(name);
}

const { deleteSelectedAsset, uploadAssets } = store;
const { assets } = storeToRefs(store);

const GAP = 12;
const TARGET_HEIGHT = 120;
const DEFAULT_RATIO = 1.4;

const listEl = useTemplateRef<HTMLElement>("listEl");

const { width } = useElementSize(listEl);

const panelWidth = computed(() => Math.round(width.value));

const ratios = ref<Record<string, number>>({});

const ratio = (name: string) => ratios.value[name] ?? DEFAULT_RATIO;

let pending: Record<string, number> = {};
let flushing = false;

function onImageLoad(event: Event, name: string) {
  const img = event.target as HTMLImageElement | null;

  if (!img?.naturalWidth || !img.naturalHeight) return;

  pending[name] = img.naturalWidth / img.naturalHeight;

  if (flushing) return;

  flushing = true;

  requestAnimationFrame(() => {
    ratios.value = { ...ratios.value, ...pending };

    pending = {};
    flushing = false;
  });
}

const placed = computed(() => (panelWidth.value ? assets.value : []));

const layout = computed(() => {
  const boxes: Record<string, Record<string, string>> = {};

  let row: Asset[] = [];
  let sum = 0;
  let top = 0;

  const place = (height: number) => {
    let left = 0;

    for (const asset of row) {
      const boxWidth = ratio(asset.name) * height;

      boxes[asset.name] = {
        left: `${left}px`,
        top: `${top}px`,
        width: `${boxWidth}px`,
        height: `${height}px`,
      };

      left += boxWidth + GAP;
    }

    top += height + GAP;
    row = [];
    sum = 0;
  };

  for (const asset of placed.value) {
    row.push(asset);
    sum += ratio(asset.name);

    const height = (panelWidth.value - GAP * (row.length - 1)) / sum;

    if (height <= TARGET_HEIGHT) place(height);
  }

  if (row.length) place(TARGET_HEIGHT);

  return { boxes, height: Math.max(0, top - GAP) };
});

const { open, onChange } = useFileDialog({ accept: ASSET_ACCEPT });

const imagePreviewModal = useTemplateRef<typeof Modal>("imagePreviewModal");
const fontPreviewModal = useTemplateRef<typeof Modal>("fontPreviewModal");
const modelPreviewModal = useTemplateRef<typeof Modal>("modelPreviewModal");

onChange(async (files) => {
  if (!files?.length) return;

  const deck = currentSlides.value?.deck;
  if (!deck) return;

  await uploadAssets(deck, Array.from(files));
});

const modelLoaders = {
  fbx: FBXLoader,
  glb: GLTFLoader,
  gltf: GLTFLoader,
  obj: OBJLoader,
  stl: STLLoader,
};

function loaderFor(name: string) {
  const extension = name.split(".").pop()?.toLowerCase() ?? "";

  return modelLoaders[extension as keyof typeof modelLoaders] ?? GLTFLoader;
}

function previewObject(data: any) {
  if (data instanceof BufferGeometry) {
    return new Mesh(data, new MeshNormalMaterial());
  }

  return data.scene ?? data;
}

const selectedAsset = ref<Asset>();

const openModal = ref<"image" | "font" | "model">();

function openImageModal(asset: Asset) {
  selectedAsset.value = asset;
  openModal.value = "image";

  imagePreviewModal.value?.open();
}

function openFontModal(asset: Asset) {
  selectedAsset.value = asset;
  openModal.value = "font";

  fontPreviewModal.value?.open();
}

function openModelModal(asset: Asset) {
  selectedAsset.value = asset;
  openModal.value = "model";

  modelPreviewModal.value?.open();
}

function closeModal() {
  openModal.value = undefined;
}
</script>
