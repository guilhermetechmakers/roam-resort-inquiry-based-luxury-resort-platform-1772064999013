import path from 'path'
import type { ClientRequest } from 'node:http'
import type { IncomingMessage } from 'node:http'
import { defineConfig, type ConfigEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

// Extract ProxyServer type from Vite's ProxyOptions configure callback
type ProxyServer = Parameters<NonNullable<ProxyOptions['configure']>>[0]

// https://vite.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  const proxy: Record<string, string | ProxyOptions> | undefined =
    mode === 'development'
      ? {
          '/api': {
            target: 'http://localhost:54321',
            changeOrigin: true,
            configure: (proxyServer: ProxyServer, _options: ProxyOptions) => {
              proxyServer.on(
                'proxyReq',
                (_proxyReq: ClientRequest, _req: IncomingMessage) => {
                  // Optional: Add headers or modify proxied requests
                }
              )
            },
          },
        }
      : undefined

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy,
    },
  }
})
