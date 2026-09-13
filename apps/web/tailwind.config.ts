import type { Config } from 'tailwindcss';

// Design tokens for the Campigo product. Deliberately avoiding
// the generic "cream + terracotta" or "dark + neon" AI-default palettes:
// this uses a deep indigo (trust/security, matches a campus ID-card feel)
// paired with a warm amber accent (hope/recovery) and a warm neutral gray.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f5f9',
          100: '#e6e8f1',
          200: '#c3c8dd',
          300: '#9aa3c4',
          400: '#6c76a0',
          500: '#4a5480',
          600: '#363f66',
          700: '#282f4d',
          800: '#1b2036',
          900: '#111422',
          950: '#0a0c18',
        },
        amber: {
          400: '#f4b860',
          500: '#eda23a',
          600: '#d6862a',
        },
        surface: {
          DEFAULT: '#faf9f6',
          raised: '#ffffff',
          sunken: '#f0eee8',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      borderRadius: {
        card: '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
