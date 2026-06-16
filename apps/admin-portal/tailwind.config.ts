import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

const config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  darkMode: ['class'],
  plugins: [tailwindcssAnimate],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        border: 'hsl(var(--border))',
        foreground: 'hsl(var(--foreground))',
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        }
      }
    }
  }
} satisfies Config;

export default config;
