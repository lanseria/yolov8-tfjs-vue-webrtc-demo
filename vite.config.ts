import path from 'path'
import { ConfigEnv, UserConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Pages from 'vite-plugin-pages'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Unocss from 'unocss/vite'
import { ArcoResolver } from 'unplugin-vue-components/resolvers'

export default ({ mode }: ConfigEnv): UserConfig => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  return {
    server: {
      host: env.VITE_HOST,
      port: +env.VITE_PORT,
      // proxy: {
      //   '^\/api\/': {
      //     target: env.VITE_PROXY_URL,
      //     changeOrigin: true,
      //     xfwd: true,
      //     rewrite: (path) => {
      //       const replacePath = path.replace(/^\/api/, '')
      //       return replacePath
      //     },
      //   },
      // },
    },
    resolve: {
      alias: {
        '~/': `${path.resolve(__dirname, 'src')}/`,
        'vue': 'vue/dist/vue.esm-bundler.js',
      },
    },
    build: {
      sourcemap: true,
    },
    plugins: [
      vue({
        reactivityTransform: true,
      }),
  
      // https://github.com/hannoeru/vite-plugin-pages
      Pages(),
  
      // https://github.com/antfu/unplugin-auto-import
      AutoImport({
        resolvers: [ArcoResolver()],
        imports: [
          'vue',
          'vue/macros',
          'vue-router',
          '@vueuse/core',
        ],
        dts: true,
        dirs: [
          './src/composables',
        ],
        vueTemplate: true,
      }),
  
      // https://github.com/antfu/vite-plugin-components
      Components({
        dts: true,
      }),
  
      // https://github.com/antfu/unocss
      // see unocss.config.ts for config
      Unocss(),
    ],
  }
}
