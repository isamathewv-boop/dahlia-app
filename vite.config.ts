/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    /*
     * Node by default — the engine and data tests are pure functions and run
     * far faster without a DOM. Page tests opt in per file with:
     *   // @vitest-environment jsdom
     */
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})
