/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f0ff',
          100: '#e5e5ff',
          200: '#ceceff',
          300: '#a8a8ff',
          400: '#7c7cff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        dark: {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#e8e8e8',
          800: '#1a1a2e',
          900: '#0f0f1a',
          950: '#07070f',
        },
        white: 'rgba(var(--white-rgb), <alpha-value>)',
        'white-fixed': '#ffffff',
        gray: {
          50: 'rgba(var(--gray-50-rgb), <alpha-value>)',
          100: 'rgba(var(--gray-100-rgb), <alpha-value>)',
          200: 'rgba(var(--gray-200-rgb), <alpha-value>)',
          300: 'rgba(var(--gray-300-rgb), <alpha-value>)',
          400: 'rgba(var(--gray-400-rgb), <alpha-value>)',
          500: 'rgba(var(--gray-500-rgb), <alpha-value>)',
          600: 'rgba(var(--gray-600-rgb), <alpha-value>)',
          700: 'rgba(var(--gray-700-rgb), <alpha-value>)',
          800: 'rgba(var(--gray-800-rgb), <alpha-value>)',
          900: 'rgba(var(--gray-900-rgb), <alpha-value>)',
          950: 'rgba(var(--gray-950-rgb), <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-soft': 'bounceSoft 1s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
      backdropBlur: { xs: '2px' },
      boxShadow: {
        'glow': '0 0 20px rgba(99, 102, 241, 0.4)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.3)',
        'neon': '0 0 5px theme(colors.primary.400), 0 0 20px theme(colors.primary.400)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
