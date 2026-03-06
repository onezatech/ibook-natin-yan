/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                coral: {
                    DEFAULT: '#FF6B6B',
                    light: '#FF8E8E',
                    dark: '#E85555',
                },
                sand: {
                    DEFAULT: '#FFD93D',
                    light: '#FFE878',
                    dark: '#E5BF2A',
                },
                ocean: {
                    DEFAULT: '#4ECDC4',
                    light: '#7EDDD6',
                    dark: '#35B8AF',
                },
                deep: {
                    DEFAULT: '#1A1A2E',
                    light: '#2D2D4E',
                    dark: '#0D0D1A',
                },
                blush: '#FFF0F0',
            },
            fontFamily: {
                display: ['Pacifico', 'cursive'],
                body: ['Nunito', 'sans-serif'],
            },
            animation: {
                'wave': 'wave 4s ease-in-out infinite',
                'float': 'float 6s ease-in-out infinite',
                'float-slow': 'float 8s ease-in-out infinite',
                'petal': 'petal 10s ease-in-out infinite',
                'bounce-slow': 'bounce 3s ease-in-out infinite',
                'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.4s ease-out forwards',
            },
            keyframes: {
                wave: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '50%': { transform: 'translateY(-20px) rotate(5deg)' },
                },
                petal: {
                    '0%': { transform: 'translateY(-20px) rotate(0deg)', opacity: 0 },
                    '10%': { opacity: 1 },
                    '90%': { opacity: 1 },
                    '100%': { transform: 'translateY(110vh) rotate(720deg)', opacity: 0 },
                },
                pulseSoft: {
                    '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                    '50%': { transform: 'scale(1.05)', opacity: 0.85 },
                },
                fadeIn: {
                    from: { opacity: 0 },
                    to: { opacity: 1 },
                },
                slideUp: {
                    from: { opacity: 0, transform: 'translateY(20px)' },
                    to: { opacity: 1, transform: 'translateY(0)' },
                },
            },
            backgroundImage: {
                'gradient-tropical': 'linear-gradient(135deg, #FF6B6B 0%, #FFD93D 50%, #4ECDC4 100%)',
                'gradient-sunset': 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                'gradient-ocean': 'linear-gradient(180deg, #4ECDC4 0%, #1A1A2E 100%)',
                'gradient-card': 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%)',
            },
            backdropBlur: {
                xs: '2px',
            },
            boxShadow: {
                'glow-coral': '0 0 20px rgba(255, 107, 107, 0.4)',
                'glow-sand': '0 0 20px rgba(255, 217, 61, 0.4)',
                'glow-ocean': '0 0 20px rgba(78, 205, 196, 0.4)',
                'card': '0 8px 32px rgba(26, 26, 46, 0.15)',
                'card-hover': '0 16px 48px rgba(26, 26, 46, 0.25)',
            },
        },
    },
    plugins: [],
}
