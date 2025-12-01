// ============================================
// DBS STORE - Blue & Gold Theme
// Tailwind CSS Configuration
// Palette "Premium Classique"
// ============================================

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class', // or 'media' for system preference
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // === Primary Colors (Blue) ===
        primary: {
          DEFAULT: '#0077B6',
          hover: '#005A8C',
          light: '#4DC4E8',
          50: '#E6F4FA',
          100: '#CCE9F5',
          200: '#99D3EB',
          300: '#66BDE1',
          400: '#33A7D7',
          500: '#0077B6',
          600: '#005F92',
          700: '#00476D',
          800: '#002F49',
          900: '#001824',
          950: '#000C12',
        },

        // === Accent Colors (Gold) ===
        accent: {
          DEFAULT: '#D4A853',
          hover: '#C49A48',
          light: '#E8C068',
          50: '#FBF6EB',
          100: '#F7EDD7',
          200: '#EFDAAF',
          300: '#E7C887',
          400: '#DFB65F',
          500: '#D4A853',
          600: '#AA8642',
          700: '#7F6532',
          800: '#554321',
          900: '#2A2211',
          950: '#151108',
        },

        // === Background Colors ===
        background: {
          DEFAULT: '#FAFBFC',
          card: '#FFFFFF',
          secondary: '#F1F5F9',
          tertiary: '#E2E8F0',
          // Dark mode variants
          dark: {
            DEFAULT: '#0D0D0F',
            card: '#18181B',
            secondary: '#27272A',
            tertiary: '#3F3F46',
          },
        },

        // === Text Colors ===
        content: {
          DEFAULT: '#0F172A',
          secondary: '#64748B',
          tertiary: '#94A3B8',
          inverse: '#FFFFFF',
          // Dark mode variants
          dark: {
            DEFAULT: '#F4F4F5',
            secondary: '#A1A1AA',
            tertiary: '#71717A',
            inverse: '#0D0D0F',
          },
        },

        // === Border Colors ===
        border: {
          DEFAULT: '#E2E8F0',
          light: '#F1F5F9',
          dark: '#CBD5E1',
          // Dark mode variants
          'dark-mode': {
            DEFAULT: '#3F3F46',
            light: '#27272A',
            dark: '#52525B',
          },
        },

        // === Semantic Colors ===
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
          dark: '#059669',
          50: '#ECFDF5',
          500: '#10B981',
          600: '#059669',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
          dark: '#DC2626',
          50: '#FEF2F2',
          500: '#EF4444',
          600: '#DC2626',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
          dark: '#D97706',
          50: '#FFFBEB',
          500: '#F59E0B',
          600: '#D97706',
        },
        info: {
          DEFAULT: '#3B82F6',
          light: '#DBEAFE',
          dark: '#2563EB',
          50: '#EFF6FF',
          500: '#3B82F6',
          600: '#2563EB',
        },
      },

      // === Gradients (use with bg-gradient-to-* + from-* + to-*) ===
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #4DC4E8 0%, #0077B6 100%)',
        'gradient-primary-dark': 'linear-gradient(135deg, #0077B6 0%, #4DC4E8 100%)',
        'gradient-accent': 'linear-gradient(135deg, #E8C068 0%, #D4A853 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0077B6 0%, #4DC4E8 100%)',
        'gradient-hero-dark': 'linear-gradient(135deg, #4DC4E8 0%, #1a3a5c 100%)',
      },

      // === Box Shadows ===
      boxShadow: {
        'card': '0 2px 8px rgba(15, 23, 42, 0.08)',
        'card-dark': '0 2px 8px rgba(0, 0, 0, 0.3)',
        'button': '0 2px 4px rgba(0, 119, 182, 0.2)',
        'button-dark': '0 2px 4px rgba(77, 196, 232, 0.3)',
        'card-hover': '0 4px 12px rgba(15, 23, 42, 0.12)',
        'card-hover-dark': '0 4px 12px rgba(0, 0, 0, 0.4)',
      },

      // === Border Radius ===
      borderRadius: {
        'card': '12px',
        'button': '8px',
        'badge': '4px',
        'pill': '9999px',
      },

      // === Font Family ===
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },

      // === Transitions ===
      transitionDuration: {
        'fast': '150ms',
        'normal': '200ms',
        'slow': '300ms',
      },

      // === Animations ===
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 300ms ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
};


// ============================================
// USAGE EXAMPLES
// ============================================

/*
 * BUTTONS:
 * 
 * Primary Button:
 * <button class="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-button shadow-button transition-normal">
 *   Ajouter au panier
 * </button>
 * 
 * Accent Button (Gold):
 * <button class="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-button transition-normal">
 *   Voir les offres
 * </button>
 * 
 * Outline Button:
 * <button class="border border-primary text-primary hover:bg-primary hover:text-white px-6 py-3 rounded-button transition-normal">
 *   En savoir plus
 * </button>
 */

/*
 * CARDS:
 * 
 * <div class="bg-background-card dark:bg-background-dark-card rounded-card shadow-card dark:shadow-card-dark border border-border dark:border-border-dark-mode p-4">
 *   <h3 class="text-content dark:text-content-dark font-semibold">Product Name</h3>
 *   <p class="text-content-secondary dark:text-content-dark-secondary">Description</p>
 *   <span class="text-accent font-bold">850 000 FCFA</span>
 * </div>
 */

/*
 * BADGES:
 * 
 * Promo Badge:
 * <span class="bg-error text-white text-xs font-semibold px-2 py-1 rounded-badge">Promo</span>
 * 
 * New Badge:
 * <span class="bg-primary text-white text-xs font-semibold px-2 py-1 rounded-badge">Nouveau</span>
 * 
 * Gold Badge:
 * <span class="bg-accent text-white text-xs font-semibold px-2 py-1 rounded-badge">Premium</span>
 */

/*
 * HERO SECTION:
 * 
 * <div class="bg-gradient-hero dark:bg-gradient-hero-dark rounded-xl p-6 text-white">
 *   <h2 class="text-2xl font-bold">Jusqu'à -30%</h2>
 *   <p class="opacity-90">Sur une sélection de smartphones</p>
 *   <button class="bg-accent mt-4 px-6 py-2 rounded-button font-semibold">
 *     Voir les offres
 *   </button>
 * </div>
 */

/*
 * DARK MODE TOGGLE:
 * 
 * Add 'dark' class to <html> or <body> to enable dark mode:
 * document.documentElement.classList.toggle('dark')
 */