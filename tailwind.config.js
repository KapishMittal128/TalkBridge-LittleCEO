/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // TalkBridge Design Tokens — from DESIGN_SYSTEM.md
        primary: {
          DEFAULT: '#2D6BE4',
          light: '#5189F0',
          dark: '#1A4FA8',
        },
        background: {
          DEFAULT: '#0F1117',
          surface: '#1A1D27',
          elevated: '#22263A',
        },
        text: {
          primary: '#F0F2F5',
          secondary: '#8A8FA0',
          muted: '#4A4F65',
        },
        emergency: {
          DEFAULT: '#E84545',
          light: '#FF6B6B',
        },
        success: '#2ECC71',
        warning: '#F0A500',
        border: '#2A2D3E',
      },
      fontFamily: {
        sans: ['Inter_400Regular', 'system-ui'],
        medium: ['Inter_500Medium', 'system-ui'],
        semibold: ['Inter_600SemiBold', 'system-ui'],
        bold: ['Inter_700Bold', 'system-ui'],
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '30px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '38px' }],
        '4xl': ['36px', { lineHeight: '44px' }],
      },
      spacing: {
        // Minimum touch target: 48dp
        'touch-min': '48px',
        'touch-lg': '64px',
      },
      borderRadius: {
        card: '16px',
        button: '12px',
        pill: '999px',
      },
    },
  },
  plugins: [],
};
