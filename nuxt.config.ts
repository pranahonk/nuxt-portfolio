export default defineNuxtConfig({
  app: {
    head: {
      title: "Nuxt3 notion portfolio",
      meta: [{ charset: "utf-8" }, { name: "viewport", content: "width=device-width, initial-scale=1" }],
      link: [{ rel: "icon", type: "image/png", href: "/logo.png" }],
    },
  },
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  modules: [
    "@nuxt/devtools",
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
