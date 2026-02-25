/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#000000', // True Black
          card: '#000000', // Card background (same as bg for seamless look, relying on borders)
          border: '#333333',
        },
        light: {
          bg: '#f8fafc', // Slate 50
          card: '#ffffff',
          border: '#e2e8f0', // Slate 200
        },
        // Prismatic colors for dark mode glow
        neon: {
          blue: '#00f2ff',
          purple: '#bd00ff',
          pink: '#ff0055',
        }
      },
      animation: {
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'border-beam': 'border-beam 4s linear infinite',
      },
      keyframes: {
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 242, 255, 0.2), 0 0 10px rgba(189, 0, 255, 0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 242, 255, 0.4), 0 0 30px rgba(189, 0, 255, 0.4)' },
        },
        'border-beam': {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
}
