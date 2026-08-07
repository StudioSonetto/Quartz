const spaRoutes = ["/atelier", "/auth", "/live"];

export default defineNuxtConfig({
  compatibilityDate: "2026-08-05",
  devtools: {
    enabled: true,
    // Timeline will cause lag in dev mode, only enable when needed.
    timeline: {
      enabled: false,
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
  app: {
    head: {
      link: [
        { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
        {
          rel: "preconnect",
          href: "https://api.fontshare.com",
          crossorigin: "",
        },
      ],
    },
  },
  routeRules: {
    "/": { prerender: true },
    "/docs/**": { prerender: true },
    ...Object.fromEntries(
      spaRoutes.map((route) => [`${route}/**`, { ssr: false }]),
    ),
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      ignore: spaRoutes,
    },
  },
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_KEY,
    },
  },
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
  // vite.server.allowedHosts is for the discord activity (wip)
  vite: {
    server: {
      allowedHosts: ["*.trycloudflare.com"],
    },
  },
  typescript: {
    typeCheck: true,
  },
});
