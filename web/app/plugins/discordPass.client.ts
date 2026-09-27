export default defineNuxtPlugin(() => {
  const pass = useDiscordPass();

  globalThis.$fetch = $fetch.create({
    onRequest({ request, options }) {
      const url = typeof request === "string" ? request : request.url;

      if (pass.value && url.startsWith("/api/"))
        options.headers.set("Authorization", `Bearer ${pass.value}`);
    },
  }) as typeof $fetch;
});
