import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="severe"]'],
  theme: {
    extend: {
      colors: {
        // Design tokens exposed as CSS variables per theme
        primary: 'var(--color-primary)',
        'primary-fg': 'var(--color-primary-fg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'on-surface': 'var(--color-on-surface)',
        accent: 'var(--color-accent)',
        badge: 'var(--color-badge)',
        rail: 'var(--color-rail)',
        'rail-fg': 'var(--color-rail-fg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '1rem',
        chip: '999px',
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
} satisfies Config;
