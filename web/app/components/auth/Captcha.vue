<template>
  <div ref="box" class="flex justify-center" />
</template>

<script setup lang="ts">
const token = defineModel<string>({ default: "" });
const box = useTemplateRef("box");
const { turnstileSiteKey } = useRuntimeConfig().public;
const { load } = useScriptTag(
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
  undefined,
  { manual: true },
);
const turnstile = () => (window as any).turnstile;

let id: string | undefined;

onMounted(async () => {
  await load();
  if (!box.value) return;
  id = turnstile().render(box.value, {
    sitekey: turnstileSiteKey,
    theme: "dark",
    appearance: "interaction-only",
    callback: (value: string) => (token.value = value),
    "expired-callback": () => (token.value = ""),
  });
});

watch(token, (value) => !value && id && turnstile().reset(id));

onBeforeUnmount(() => id && turnstile().remove(id));
</script>
