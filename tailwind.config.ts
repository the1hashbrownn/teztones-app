import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#1a1b26',
        'background-darker': '#13141f',
        surface: '#1f2133',
        'surface-lighter': '#2a2d3d',
        'surface-hover': '#363b54',
      },
    },
  },
  darkMode: 'class',
  plugins: [],
};

export default config;