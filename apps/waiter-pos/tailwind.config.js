/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Same brand palette as the table PWA (front-of-house, well-lit) -
        // unlike the dark KDS kiosk, this runs in the dining room.
        primary: { DEFAULT: '#EA580C', dark: '#C2410C', light: '#FED7AA' },
        ink: '#1C1917',
        surface: '#FFFBF5',
        card: '#FFFFFF',
        muted: '#78716C',
        border: '#E7E1D8',
        success: '#16A34A',
        cooking: '#F59E0B',
        error: '#DC2626',
        reserved: '#7C3AED',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '12px',
        lg: '16px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
