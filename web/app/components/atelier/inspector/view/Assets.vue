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
              action: () =>
                currentSlides && deleteSelectedAsset(currentSlides.deck, asset),
            },
          ])
        "
      >
        <button v-if="store.isImage(asset.name)" @click="openImageModal(asset)">
          <NuxtImg :src="asset.url.toString()" :alt="asset.name" />
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
                :loader="GLTFLoader as any"
                :url="asset.url.toString()"
              >
                <primitive :object="(data as any).scene" />
              </UseLoader>
            </Suspense>
          </TresCanvas>
        </button>
        <button v-else>
          <p>Unsupported asset: {{ asset.name }}</p>
        </button>
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
        :src="selectedAsset.url.toString()"
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
              :loader="GLTFLoader as any"
              :url="selectedAsset?.url.toString()"
            >
              <primitive :object="(data as any).scene" />
            </UseLoader>
          </Suspense>
          <OrbitControls />
        </TresCanvas>
      </div>
    </Modal>
  </AtelierInspectorView>
</template>

<style scoped lang="postcss">
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
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import type Modal from "@/components/Modal.vue";

const client = useSupabaseClient();

const { currentSlides } = storeToRefs(useDeckStore());

const store = useAssetsStore();

const assetDrag = useAssetDrag();

function onDragStart(event: DragEvent, name: string) {
  event.dataTransfer?.setData(ASSET_MIME, name);
  event.dataTransfer!.effectAllowed = "copy";

  assetDrag.start(name);
}

const { fetchAssets, deleteSelectedAsset } = store;
const { assets } = storeToRefs(store);

const { open, onChange } = useFileDialog({
  accept: "image/*, .ttf, .otf, .woff, .woff2, .fbx, .glb, .gltf, .obj",
});

const imagePreviewModal = ref<typeof Modal>();
const fontPreviewModal = ref<typeof Modal>();
const modelPreviewModal = ref<typeof Modal>();

onChange(async (files) => {
  if (!files?.length) return;

  const deck = currentSlides.value?.deck;
  if (!deck) return;

  for (const file of files) {
    const { error } = await client.storage
      .from("assets")
      .upload(`${deck}/${file.name}`, file);

    if (error) {
      console.error(error);
    }
  }

  await fetchAssets(deck);
});

const selectedAsset = ref<{ name: string; url: URL }>();

function openImageModal(asset: { name: string; url: URL }) {
  imagePreviewModal.value?.open();

  selectedAsset.value = asset;
}

function openFontModal(asset: { name: string; url: URL }) {
  fontPreviewModal.value?.open();

  selectedAsset.value = asset;
}

function openModelModal(asset: { name: string; url: URL }) {
  modelPreviewModal.value?.open();

  selectedAsset.value = asset;
}

function closeModal() {
  selectedAsset.value = undefined;
}
</script>
