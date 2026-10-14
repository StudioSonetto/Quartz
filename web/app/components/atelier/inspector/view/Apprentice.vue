<template>
  <AtelierInspectorView name="Apprentice" :actions="actions">
    <form
      v-if="!apprentice.key.value || editing"
      class="apprentice-key"
      @submit.prevent="saveKey"
    >
      <p>
        Currently only supports Antrophic Claude models, insert your API key to
        start using.
      </p>
      <input
        v-model="draftKey"
        type="password"
        placeholder="sk-ant-…"
        autocomplete="off"
      />
      <select v-model="apprentice.model.value">
        <option value="claude-opus-5-5">Claude Opus 5.5</option>
        <option value="claude-sonnet-5-5">Claude Sonnet 5.5</option>
        <option value="claude-haiku-5-5">Claude Haiku 5.5</option>
      </select>
      <UIButton type="submit">Save</UIButton>
    </form>

    <template v-else>
      <ol class="apprentice-log">
        <li
          v-for="(entry, i) in shown"
          :key="i"
          :class="`apprentice-${entry.role}`"
        >
          {{ entry.text }}
        </li>
        <li v-if="apprentice.streaming.value" class="apprentice-assistant">
          {{ apprentice.streaming.value }}
        </li>
      </ol>
      <p v-if="apprentice.error.value" class="apprentice-error">
        {{ apprentice.error.value }}
      </p>
      <p v-if="apprentice.notice.value" class="apprentice-notice">
        {{ apprentice.notice.value }}
      </p>
      <p v-if="apprentice.usage.value.output" class="apprentice-usage">
        {{ apprentice.usage.value.input + apprentice.usage.value.output }}
        tokens
      </p>
      <form class="apprentice-input" @submit.prevent="submit">
        <textarea
          ref="input"
          v-model="draft"
          placeholder="Make a 6-slide pitch about…"
          @keydown.enter.exact="
            !$event.isComposing && ($event.preventDefault(), submit())
          "
        />
        <UIButton
          v-if="apprentice.busy.value"
          type="button"
          @click="apprentice.stop()"
          >Stop</UIButton
        >
        <UIButton v-else type="submit" :disabled="!draft.trim()">Send</UIButton>
      </form>
    </template>
  </AtelierInspectorView>
</template>

<style scoped lang="postcss">
.apprentice {
  .apprentice-key,
  .apprentice-input {
    @apply flex flex-col gap-2;
  }

  .apprentice-log {
    @apply list-none flex-1 overflow-y-auto flex flex-col gap-3 ui-text-3;

    .apprentice-user {
      @apply self-end bg-dark-500 px-3 py-2 rounded;
    }

    .apprentice-tool {
      @apply opacity-50;
    }
  }

  .apprentice-error,
  .apprentice-notice,
  .apprentice-usage {
    @apply ui-text-3;
  }

  .apprentice-error {
    @apply text-red-400;
  }

  .apprentice-notice {
    @apply text-yellow-400;
  }

  .apprentice-usage {
    @apply opacity-50;
  }
}
</style>

<script setup lang="ts">
const deckId = useRoute().params.id as string;
const apprentice = useApprentice(deckId);
const draft = ref("");
const input = useTemplateRef<HTMLTextAreaElement>("input");
const draftKey = ref("");
const editing = ref(false);

const actions = computed(() => [
  {
    icon: "i-carbon-settings",
    tooltip: "Key and model",
    onClick: () => (editing.value = !editing.value),
  },
  {
    icon: "i-carbon-trash-can",
    tooltip: "Clear chat",
    onClick: apprentice.clear,
    disabled: apprentice.busy.value,
  },
]);

type Line = { role: string; text: string };

function lineOf(role: string, block: any): Line | undefined {
  if (block.type === "text") return { role, text: block.text };
  if (block.type === "tool_use") return { role: "tool", text: block.name };
  if (block.type === "tool_result" && block.is_error)
    return { role: "tool", text: `↳ ${block.content}` };
}

const shown = computed(() =>
  apprentice.messages.value.flatMap((m) =>
    (typeof m.content === "string"
      ? [{ type: "text", text: m.content }]
      : m.content
    )
      .map((block) => lineOf(m.role, block))
      .filter((line): line is Line => !!line),
  ),
);

function saveKey() {
  if (draftKey.value.trim()) apprentice.key.value = draftKey.value.trim();

  draftKey.value = "";
  editing.value = false;
}

function submit() {
  const text = draft.value.trim();

  if (!text || apprentice.busy.value) return;

  draft.value = "";
  apprentice.send(text);
  input.value?.focus();
}
</script>
