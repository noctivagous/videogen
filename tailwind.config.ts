import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './PoseBlock/app/**/*.{js,ts,jsx,tsx,mdx}',
    './PoseBlock/components/**/*.{js,ts,jsx,tsx,mdx}',
    './PoseBlock/lib/**/*.{js,ts,jsx,tsx,mdx}',
    './PoseBlock/*.{js,ts,jsx,tsx,mdx}',
    './lib/poseblock/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#1a1d23',
          800: '#1f232b',
          700: '#2a2f38',
          600: '#3a404b',
          500: '#525864',
        },
        brand: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;