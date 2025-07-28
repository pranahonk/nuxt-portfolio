import { ComputedRef, Ref } from 'vue'
export type LayoutKey = "default"
declare module "/Volumes/TEAM SSD/WebstormProjects/nuxt-portfolio/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    layout?: false | LayoutKey | Ref<LayoutKey> | ComputedRef<LayoutKey>
  }
}