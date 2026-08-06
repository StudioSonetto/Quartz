<template>
  <header class="atelier-header">
    <NuxtLink class="header-btn border-r" to="/atelier">
      <div class="i-carbon-switcher"></div>
    </NuxtLink>
    <input
      type="text"
      maxlength="30"
      v-model="draft"
      @focus="editing = true"
      @blur="editing = false"
      @change="commit"
    />
    <button class="header-btn" @click="modal?.open()">
      <div class="i-carbon-run"></div>
    </button>
    <Modal ref="modal" title="Presentation mode">
      <form @submit.prevent="onSubmit">
        <div class="side">
          <div>
            <h5>Local</h5>
            <div class="whitespace"></div>
            <p>Your regular presentation experience.</p>
          </div>
          <UIButton type="submit">Confirm</UIButton>
        </div>
        <div class="divider">
          <span>OR</span>
        </div>
        <div class="side">
          <div>
            <h5>Online (WIP)</h5>
            <div class="whitespace"></div>
            <p>Audience can join the presentation, and interact with you.</p>
          </div>
          <UIButton :disabled="true">Confirm</UIButton>
        </div>
      </form>
    </Modal>
  </header>
</template>

<style scoped lang="postcss">
.atelier-header {
  @apply flex justify-between items-center;
  @apply bg-dark-500 h-20;
  @apply border-solid border-0 border-b-2 border-dark-200;

  .header-btn {
    @apply w-20 h-full;
    @apply flex items-center justify-center;
    @apply hover:bg-light-200 hover:text-dark-500;
    @apply rounded-none transition-colors;

    [class*="i-"] {
      @apply ui-text-5;
    }
  }

  form {
    @apply flex flex-row gap-4;

    .side {
      @apply flex flex-col flex-1 m-0 gap-40 justify-between;

      h5 {
        @apply text-lg text-center;
      }

      p {
        @apply text-center opacity-60;
      }

      button {
        @apply w-1/2 mx-auto;
      }
    }

    .divider {
      @apply relative mx-4;

      &::before {
        content: "";
        @apply absolute w-px h-full bg-dark-200;
      }

      span {
        @apply absolute left-1/2 top-1/2 bg-dark-900 py-6;
        @apply translate-x-[-50%] translate-y-[-50%];
      }
    }
  }

  input {
    @apply text-4 text-center border-none;
    @apply hover-underline focus-underline;
    @apply field-sizing-content;
  }
}
</style>

<script setup lang="ts">
import type Modal from "@/components/Modal.vue";

const { updateDeckTitle } = useDeckStore();
const { clear } = useNodeSelection();

const props = defineProps<{
  title: string;
}>();

const modal = ref<typeof Modal>();

const draft = ref(props.title);
const editing = ref(false);

watch(
  () => props.title,
  (value) => {
    if (editing.value) return;

    draft.value = value;
  },
);

function commit() {
  const trimmed = draft.value.trim();

  if (!trimmed.length) {
    draft.value = props.title;

    return;
  }

  draft.value = trimmed;

  updateDeckTitle(trimmed);
}

async function onSubmit() {
  modal.value?.close();

  clear();

  await navigateTo(`/live/${useRoute().params.id}`);
}
</script>
