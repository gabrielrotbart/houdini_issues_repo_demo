/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

module.exports = {
  mode: 'jit',
  content: [
    "./index.html",
    "./app/frontend/entrypoints/*.{js,ts,jsx,tsx,svelte}",
    "./app/frontend/Pages/**/*.{js,ts,jsx,tsx,svelte}",
    "./app/frontend/components/*.{js,ts,jsx,tsx,svelte}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'base': colors.sky,
        'primary-focus': '#1F3842',
        'primary-content': '#B3E9FF',
        'secondary': '#E8C469',
        'secondary-focus': '#E0AE2E',
        'secondary-content': '#423000',
        'accent': '#F4A362',
        'accent-focus': '#EF7D1F',
        'accent-content': '#421E00',
        'neutral': '#222C39',
        'neutral-focus': '#1B232D',
        'neutral-content': '#BED3EF',
        'base-100': '#CFE0F2',
        'base-200': '#ACC8E8',
        'base-300': '#8AB4DF',
        'base-content': '#062D55',
        'success': '#37D399',
        'success-content': '#013320',
        'warning': '',
        'warning-content': '',
        'error': '#F87272',
        'error-content': '#470001'
      }
    },
  }
}
