export default defineNuxtConfig({
  nitro: {
    // prerender: {
    //   routes: ['/']
    // }
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
      title: "Prana Apsara Wijaya's Portfolio",
      meta: [
        { charset: "utf-8" }, 
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "google-site-verification", content: "Pxn-EftTSqZBgx5TI5vHBM9oiZ6QxvRtG-qIeuA6TMM" }
      ],
      link: [{ rel: "icon", type: "image/png", href: "/logo.png" }],
    },
  },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    "@nuxt/devtools",
    "@nuxt/image",
    ["vue3-notion/nuxt", { css: true }],
    '@nuxtjs/color-mode'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  runtimeConfig: {
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
