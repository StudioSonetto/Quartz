export default defineNuxtConfig({
  devtools: {
    enabled: true,
    timeline: {
      enabled: true,
    },
  },
  modules: [
    "@nuxt/content",
    "@nuxt/image",
    "@nuxtjs/supabase",
    "@pinia/nuxt",
    "@tresjs/nuxt",
    // @unocss/nuxt serves its virtual CSS from a `/__uno.css` dev endpoint
    // that Nuxt's Vitest environment can't resolve on Windows (vite-node
    // treats it as a real file path). Skip it under Vitest — it's not
    // needed for testing composables/components in isolation.
    ...(process.env.VITEST ? [] : ["@unocss/nuxt"]),
    "@vee-validate/nuxt",
    "@vueuse/nuxt",
    "nuxt-resend",
  ],
  supabase: {
    redirectOptions: {
      login: "/auth",
      callback: "/auth/callback",
      exclude: ["/", "/docs"],
    },
  },

  tres: {
    devtools: true,
    glsl: true,
  },
  compatibilityDate: "2025-08-25",
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
  vite: {
    server: {
      allowedHosts: ["*.trycloudflare.com"],
    },
  },
  typescript: {
    typeCheck: true,
  },
});
