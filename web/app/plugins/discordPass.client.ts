export default defineNuxtPlugin(() => {
  const pass = useDiscordPass();

  globalThis.$fetch = $fetch.create({
    onRequest({ options }) {
      if (pass.value)
        options.headers.set("Authorization", `Bearer ${pass.value}`);
    },
  }) as typeof $fetch;
});
