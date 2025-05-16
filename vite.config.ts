import path from 'node:path'
import process from 'node:process'
import { URL, fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import topLevelAwait from 'vite-plugin-top-level-await'
import { defineConfig, loadEnv } from 'vite'
import type { ConfigEnv, UserConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import {
  AntDesignVueResolver,
  ElementPlusResolver,
  TDesignResolver,
} from 'unplugin-vue-components/resolvers'
import { createSvgIconsPlugin } from 'vite-plugin-svg-icons'
import { manualChunksPlugin } from 'vite-plugin-webpackchunkname'
import UnoCSS from 'unocss/vite'
import { visualizer } from 'rollup-plugin-visualizer'
import { VantResolver } from '@vant/auto-import-resolver'

// 手动导入
import ElementPlus from 'unplugin-element-plus/vite'
import moveAssetsToBottom from './moveAssetsToBottom'

function pathResolve(dir: string): any {
  return fileURLToPath(new URL(dir, import.meta.url))
}

const alias: Record<string, string> = {
  '@': pathResolve('./src'),
  '~': pathResolve('./'),
}
const viteConfig = defineConfig(({ command, mode }: ConfigEnv): UserConfig => {
  const {
    VITE_PORT,
    VITE_OUTPUT_DIR,
    VITE_PUBLIC_PATH,
    VITE_API_PROXY,
  } = loadEnv(mode, process.cwd())
  return {
    plugins: [
      vue(),
      ElementPlus({
        useSource: true,
      }),
      AutoImport({
        resolvers: [
          ElementPlusResolver(),
          AntDesignVueResolver(),
          TDesignResolver({ library: 'vue-next' }),
          VantResolver(),
        ],
      }),
      Components({
        dirs: ['src/components'],
        resolvers: [
          ElementPlusResolver({
            importStyle: 'sass',
          }),
          AntDesignVueResolver({
            importStyle: 'less', // css in js
          }),
          TDesignResolver({ library: 'vue-next' }),
          VantResolver(),
        ],
        directoryAsNamespace: true,
      }),
      createSvgIconsPlugin({
        iconDirs: [path.resolve(process.cwd(), 'src/assets/svg')],
        symbolId: 'icon-[dir]-[name]',
        svgoOptions: {
          plugins: [
            {
              name: 'removeAttrs',
              params: { attrs: ['fill'] },
            },
          ],
        },
      }),
      topLevelAwait({
        // The export name of top-level await promise for each chunk module
        promiseExportName: '__tla',
        // The function to generate import names of top-level await promise in each chunk module
        promiseImportName: i => `__tla_${i}`,
      }),
      manualChunksPlugin(),
      UnoCSS(),
      visualizer({ open: false }),
      moveAssetsToBottom(),
    ],
    root: process.cwd(),
    resolve: {
      alias,
    },
    base: command === 'serve' ? './' : VITE_PUBLIC_PATH,
    optimizeDeps: {},
    server: {
      host: '0.0.0.0',
      port: VITE_PORT as unknown as number,
      open: true,
      proxy: {
        '/api': {
          target: VITE_API_PROXY,
          ws: true,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      target: 'modules',
      outDir: VITE_OUTPUT_DIR,
      minify: 'esbuild',
      sourcemap: false,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].[hash].js`,
          chunkFileNames: `assets/[name].[hash].js`,
          assetFileNames: `assets/[name].[hash].[ext]`,
          compact: true,
          manualChunks: {
            vue: ['vue', 'vue-router', 'pinia'],
          },
        },
      },
    },
    css: {
      preprocessorOptions: {
        css: {
          charset: false,
        },
        scss: {
          // 自定义的主题色
          additionalData: `@use "@/styles/variable.scss" as *;`,
        },
      },
    },
  }
})

export default viteConfig
