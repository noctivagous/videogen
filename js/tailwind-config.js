tailwind.config = {
  theme: {
    extend: {
      colors: {
        surface: {
          900: '#0a0a0b',
          800: '#131316',
          700: '#1c1c21',
          600: '#27272d',
          500: '#3f3f46'
        },
        brand: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out'
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        }
      }
    }
  }
}