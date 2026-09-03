<!-- Kinda ugly, might refactor in future. -->

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
      <div v-if="assets.length" class="list">
        <div
          v-for="asset in assets"
          class="item"
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
            <NuxtImg :src="asset.url" :alt="asset.name" />
          </button>
          <button
            v-else-if="store.isFont(asset.name)"
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
        v-if="selectedAsset"
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
        v-if="selectedAsset"
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
        <TresCanvas v-if="selectedAsset">
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
  @apply grid grid-cols-4 gap-6;

  .item {
    @apply w-full h-30;
    @apply border-solid border-2 rounded-lg;
    @apply border-dark-200 hover:border-light-200;
    @apply overflow-hidden transition-colors;

    button {
      @apply w-full h-full rounded-lg;
      @apply break-words;

      img {
        @apply w-full h-full object-cover;
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

const selectedAsset = ref<{ name: string; url: string }>();

function openImageModal(asset: { name: string; url: string }) {
  imagePreviewModal.value?.open();

  selectedAsset.value = asset;
}

function openFontModal(asset: { name: string; url: string }) {
  fontPreviewModal.value?.open();

  selectedAsset.value = asset;
}

function openModelModal(asset: { name: string; url: string }) {
  modelPreviewModal.value?.open();

  selectedAsset.value = asset;
}

function closeModal() {
  selectedAsset.value = undefined;
}
</script>
