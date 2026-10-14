const spaRoutes = ["/atelier", "/auth", "/live", "/discord"];

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
    "@nuxtjs/sitemap",
    "@nuxt/content",
    "@nuxt/image",
    "@nuxtjs/supabase",
    "@pinia/nuxt",
    "@tresjs/nuxt",
    ...(process.env.VITEST ? [] : ["@unocss/nuxt"]),
    "@vee-validate/nuxt",
    "@vueuse/nuxt",
  ],
  $development: {
    extends: ["../../QuartzWebGLModule"],
  },
  $production: {
    extends: process.env.GITHUB_TOKEN
      ? [
          [
            "github:StudioSonetto/QuartzWebGLModule",
            { auth: process.env.GITHUB_TOKEN, install: true },
          ],
        ]
      : [],
  },
  imports: {
    dirs: ["modules"],
  },
  site: {
    url: "https://quartz.graphics",
    name: "Quartz",
  },
  sitemap: {
    xsl: false,
    zeroRuntime: true,
  },
  app: {
    head: {
      htmlAttrs: { lang: "en" },
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
    "/legal/**": { prerender: true },
    "/**": {
      headers: {
        "Content-Security-Policy-Report-Only": [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://challenges.cloudflare.com https://va.vercel-scripts.com",
          "style-src 'self' 'unsafe-inline' https://api.fontshare.com https://fonts.googleapis.com",
          "font-src 'self' data: https://cdn.fontshare.com https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://*.supabase.co",
          "media-src 'self' blob: https://*.supabase.co",
          "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.anthropic.com https://api.github.com https://vitals.vercel-insights.com",
          "frame-src https://challenges.cloudflare.com",
          "worker-src 'self' blob:",
          "object-src 'none'",
          "base-uri 'self'",
        ].join("; "),
      },
    },
    ...Object.fromEntries(
      spaRoutes.map((route) => [`${route}/**`, { ssr: false, sitemap: false }]),
    ),
  },
  nitro: {
    prerender: {
      crawlLinks: true,
      ignore: [...spaRoutes, "/api"],
    },
  },
  runtimeConfig: {
    discordBotToken: "",
    discordClientSecret: "",
    polarAccessToken: "",
    polarWebhookSecret: "",
    polarServer: "",
    polarProProductId: "",
    public: {
      discordClientId: "",
      turnstileSiteKey: "",
    },
  },
  supabase: {
    redirectOptions: {
      login: "/auth",
      callback: "/auth/callback",
      exclude: ["/", "/docs*", "/legal/*", "/discord", "/live/*"],
      saveRedirectToCookie: true,
    },
  },
  tres: {
    devtools: true,
    glsl: true,
  },
  // Lets the Discord activity reach dev through a cloudflared tunnel.
  vite: {
    server: {
      allowedHosts: [".trycloudflare.com"],
    },
  },
  typescript: {
    typeCheck: true,
  },
});
