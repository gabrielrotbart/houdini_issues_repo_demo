import { createInertiaApp } from '@inertiajs/svelte'
import axios from 'axios'

const pages = import.meta.glob('../Pages/**/*.svelte', { eager: true });

const csrfToken = document.querySelector('meta[name=csrf-token]').content
axios.defaults.headers.common['X-CSRF-Token'] = csrfToken

createInertiaApp({
  resolve: (name) => {
    console.log('pages', pages)
    const component = pages[`../Pages/${name}.svelte`];
    if (!component)
      throw new Error(
        `Unknown page ${name}. Is it located under Pages with a .svelte extension?`,
      );

    return component;
  },
  setup({ el, App, props }) {
    new App({ target: el, props })
  }
})
