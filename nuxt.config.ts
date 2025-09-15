export default defineNuxtConfig({
  ssr: false,
  nitro: {
    prerender: {
      routes: ['/'],
      crawlLinks: true
    },
    routeRules: {
      '/': { headers: { 'cache-control': 's-maxage=31536000' } },
      '/**': { headers: { 'cache-control': 's-maxage=31536000' } },
      '/_nuxt/**': { headers: { 'cache-control': 's-maxage=31536000' } },
      '/cms/**': {
        headers: {
          'cache-control': 'no-cache, no-store, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet'
        },
        robots: false
      }
    }
  },
  sourcemap: {
    server: true,
    client: true
  },
  image: {
    domains: ['www.notion.so', 's3.us-west-2.amazonaws.com', 'miro.medium.com', 'user-images.githubusercontent.com', 'binus.ac.id', 'raw.githubusercontent.com'],
    provider: 'ipx',
    ipx: {
      modifiers: {
        quality: 80,
        format: 'webp'
      }
    }
  },
  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      title: "Prana Apsara Wijaya's Portfolio",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "description", content: "Prana Apsara Wijaya's portfolio - a passionate Javascript developer from Indonesia who loves to build and deliver quality products." },
        { name: "google-site-verification", content: "Pxn-EftTSqZBgx5TI5vHBM9oiZ6QxvRtG-qIeuA6TMM" }
      ],
      link: [
        { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
        { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
        { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
        { rel: "manifest", href: "/site.webmanifest" }
      ],
    },
  },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    "@nuxt/devtools",
    "@nuxt/image",
    ["vue3-notion/nuxt", { css: true }],
    '@nuxtjs/color-mode',
    '@vueuse/nuxt'
  ],
  colorMode: {
    classSuffix: '',
    preference: 'system',
    fallback: 'light'
  },
  postcss: {
    plugins: {
      'postcss-import': {},
      'tailwindcss/nesting': {},
      'tailwindcss': {},
      'autoprefixer': {},
      'postcss-nested': {},
      'postcss-preset-env': {
        features: { 'nesting-rules': false },
      },
    },
  },
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "~/assets/css/main.css";`
        }
      }
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-here',
    cmsPassword: process.env.CMS_PASSWORD || 'admin123',
    public: {
      baseURL: process.env.BASE_URL,
      githubUsername: process.env.GITHUB_USERNAME,
      notionTableId: process.env.NOTION_TABLE_ID,
      notionAboutPageId: process.env.NOTION_ABOUT_PAGE_ID,
      notionPortfolioPageId: process.env.NOTION_PORTFOLIO_PAGE_ID,
      devName: process.env.DEV_NAME,
      devDescription: process.env.DEV_DESCRIPTION,
      devRole: process.env.DEV_ROLE,
      devGithubLink: process.env.DEV_GITHUB_LINK,
      devTwitterLink: process.env.DEV_TWITTER_LINK,
      devLinkedinLink: process.env.DEV_LINKEDIN_LINK,
      devLogo: process.env.DEV_LOGO,
    },
  }
});
