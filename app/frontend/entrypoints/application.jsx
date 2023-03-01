import React from 'react'
import { render } from 'react-dom'
import { createInertiaApp } from '@inertiajs/inertia-react'

const pages = import.meta.glob('../Pages/**/*.jsx', { eager: true });

createInertiaApp({
  resolve: (name) => {
    const component = pages[`../Pages/${name}.jsx`];
    if (!component)
      throw new Error(
        `Unknown page ${name}. Is it located under Pages with a .vue extension?`,
      );

    return component;
  },

  setup({ el, App, props }) {
    render(<App {...props} />, el)
  },
})
