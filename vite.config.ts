import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import { svelte } from '@sveltejs/vite-plugin-svelte';
import houdini from 'houdini/vite'


export default defineConfig({
  resolve: {
    dedupe: ['axios']
  },
  plugins: [
    RubyPlugin(),
    houdini(),
    svelte()
  ],
})