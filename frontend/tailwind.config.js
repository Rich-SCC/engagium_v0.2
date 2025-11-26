/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f5f5',
          100: '#dce7e6',
          200: '#b9cfcd',
          300: '#96b7b4',
          400: '#739f9b',
          500: '#557170',
          600: '#557170',
          700: '#466060',
          800: '#3a5050',
          900: '#2e4040',
        },
        accent: {
          50: '#f0f5f5',
          100: '#dce7e6',
          200: '#b9cfcd',
          300: '#96b7b4',
          400: '#739f9b',
          500: '#557170',
          600: '#557170',
          700: '#466060',
          800: '#3a5050',
          900: '#2e4040',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
    },
  },
  plugins: [],
}