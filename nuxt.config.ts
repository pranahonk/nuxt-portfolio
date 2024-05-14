export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: process.env.GITHUB_USERNAME,
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: process.env.DEV_DESCRIPTION},
      { name: 'format-detection', content: 'telephone=no' },
      /* Twitter */
      {hid: "twitter:card", name: "twitter:card", content: "summary"},
      {hid: "twitter:site", name: "twitter:site", content: process.env.DEV_NAME},
      {hid: "twitter:creator", name: "twitter:creator", content: process.env.DEV_NAME},
      {hid: "twitter:title", name: "twitter:title", content: process.env.DEV_NAME},
      {hid: "twitter:description", name: "twitter:description", content: process.env.DEV_DESCRIPTION},
      {hid: "twitter:image", name: "twitter:image", content: '/favicon.ico'},
      /* Open-Graph */
      {hid: "og:type", name: "og:type", content: "website"},
      {hid: "og:site_name", name: "og:site_name", content: process.env.DEV_NAME},
      {hid: "og:description", name: "og:description", content: process.env.DEV_DESCRIPTION},
      {hid: "og:image", name: "og:image", content: '/favicon.ico'},
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', sizes: '57x57', href: '/apple-icon-57x57.png' },
      { rel: 'apple-touch-icon', sizes: '60x60', href: '/apple-icon-60x60.png' },
      { rel: 'apple-touch-icon', sizes: '72x72', href: '/apple-icon-72x72.png' },
      { rel: 'apple-touch-icon', sizes: '76x76', href: '/apple-icon-76x76.png' },
      { rel: 'apple-touch-icon', sizes: '114x114', href: '/apple-icon-114x114.png' },
      { rel: 'apple-touch-icon', sizes: '152x152', href: '/apple-icon-152x152.png' },
      { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-icon-180x180.png' },
      { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/android-icon-192x192.png'},
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png'},
      { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png'},
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png'},
      { rel: 'manifest', href: '/manifest.json'}
    ]
  },

  css: [],

  plugins: [
    "@/plugins/util",
    '@/plugins/disqus'
  ],

  components: true,

  buildModules: [
    '@nuxtjs/eslint-module',
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    'vue-notion/nuxt',
    '@aceforth/nuxt-optimized-images',
    '@nuxtjs/google-analytics'
  ],

  modules: [
    '@nuxtjs/axios',
    '@nuxtjs/sitemap'
  ],

  build: {},
  colorMode: {
    classSuffix: ''
  },

  optimizedImages: {
    optimizeImages: true
  },

  // Sitemap Configuration: https://sitemap.nuxtjs.org/usage/sitemap-options#from-a-function-which-returns-a-promise
  sitemap: {
    hostname: "https://prana-wijaya.netlify.app/" || process.env.BASE_URL,
    routes: async () => {
      const notion = require('vue-notion')
      const pageTable = await notion.getPageTable(process.env.NOTION_TABLE_ID)
      // console.log(pageTable)
      return pageTable.filter((item) => !!item.public).map((item) => `/posts/${item.slug}`)
    }
  },

  // Google Analytics Configuration: https://google-analytics.nuxtjs.org
  googleAnalytics: {
    id: process.env.GOOGLE_ANALYTICS_ID,
  },

  server: {
    port: 8000 // default: 3000
  },

  publicRuntimeConfig: {
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
