import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import neon from './neon-vite-plugin.ts'
import { nitro } from 'nitro/vite'

const config = defineConfig(({ command }) => ({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    neon,
    // Nitro's Vite env ("nitro") is unreliable under `bun --bun vite` in
    // *dev* (worker: environment unavailable → SIGTRAP). TanStack Start
    // handles SSR in Vite during `vite dev`; keep Nitro for production
    // builds only so we still get the Bun preset / Vercel output.
    ...(command === 'build'
      ? [
          nitro({
            // On Vercel, omit preset so Nitro emits the Vercel Build Output API.
            // Locally / elsewhere, use bun so `bun run start` can serve `.output/server`.
            ...(process.env.VERCEL ? {} : { preset: 'bun' as const }),
            rollupConfig: { external: [/^@sentry\//] },
          }),
        ]
      : []),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
}))

export default config
