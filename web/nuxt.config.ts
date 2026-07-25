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
  app: {
    head: {
      link: [{ rel: "icon", type: "image/svg+xml", href: "/favicon.svg" }],
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
  // For discord activity
  vite: {
    server: {
      allowedHosts: ["*.trycloudflare.com"],
    },
  },
  typescript: {
    typeCheck: true,
  },
});
