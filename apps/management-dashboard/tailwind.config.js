/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Same brand accent as every other app, on a neutral desktop
        // surface (this is a data-dense internal tool, not a kiosk or a
        // customer-facing screen).
        primary: { DEFAULT: '#EA580C', dark: '#C2410C', light: '#FED7AA' },
        ink: '#1C1917',
        surface: '#FAFAF9',
        card: '#FFFFFF',
        muted: '#78716C',
        border: '#E7E5E4',
        success: '#16A34A',
        cooking: '#F59E0B',
        error: '#DC2626',
        sidebar: '#1C1917',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '10px',
        lg: '14px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
