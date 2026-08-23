import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#1e6fd9',
          600: '#1559b3',
          700: '#0f4a99',
          800: '#0d3a73',
          900: '#0a163d',
          950: '#050a1f',
        },
        accent: {
          DEFAULT: '#d4a857',
          light: '#e8c478',
          dark: '#b88a3a',
        },
        whatsapp: {
          DEFAULT: '#00d4a8',
          dark: '#00b894',
          light: '#1de9b6',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Inter', 'system-ui', 'sans-serif'],
      },
      container: {
        center: true,
        padding: '1rem',
        screens: {
          '2xl': '1280px',
        },
      },
      boxShadow: {
        'whatsapp-glow': '0 0 24px rgba(0, 212, 168, 0.5), 0 0 56px rgba(0, 212, 168, 0.22)',
      },
    },
  },
  plugins: [],
};

export default config;
