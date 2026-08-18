/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark kiosk variant of the shared brand tokens - a wall-mounted
        // screen under kitchen lighting needs high contrast, not the warm
        // off-white the customer-facing apps use.
        primary: { DEFAULT: '#EA580C', dark: '#C2410C', light: '#FED7AA' },
        surface: '#0B0B0D',
        card: '#18181B',
        cardhover: '#202023',
        ink: '#F5F5F4',
        muted: '#A1A1AA',
        border: '#2A2A2E',
        success: '#16A34A',
        cooking: '#F59E0B',
        error: '#DC2626',
        queued: '#52525B',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '14px',
        lg: '18px',
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
