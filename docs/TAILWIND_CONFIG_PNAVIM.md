# 🎨 Configuration Tailwind pour PNAVIM

Ce document contient la configuration complète Tailwind CSS pour implémenter la Charte Graphique PNAVIM V1.0

## 📦 Installation des Dépendances

```bash
npm install -D tailwindcss postcss autoprefixer
npm install @tailwindcss/typography
```

## ⚙️ Configuration Complète

### `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Couleurs PNAVIM - "L'Âme du Marché"
      colors: {
        pnavim: {
          // Palette Terre & Soleil
          terre: {
            DEFAULT: '#C25E00',
            dark: '#A04000',
            light: '#D35400',
          },
          orange: {
            DEFAULT: '#E67E22',
            light: '#F39C12',
          },
          // Palette Nature
          manioc: {
            DEFAULT: '#2E7D32',
            light: '#4CAF50',
            dark: '#1B5E20',
          },
          // Palette Accents
          moutarde: {
            DEFAULT: '#F1C40F',
            light: '#F4D03F',
          },
          or: '#F39C12',
          // Palette Neutres
          sable: {
            DEFAULT: '#FFF5E6',
            dark: '#FFEFD5',
          },
          charbon: {
            DEFAULT: '#2D3436',
            light: '#636E72',
          },
        },
        // Aliases pour faciliter l'usage
        primary: {
          DEFAULT: '#C25E00',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#E67E22',
          foreground: '#FFFFFF',
        },
        success: {
          DEFAULT: '#2E7D32',
          foreground: '#FFFFFF',
        },
        accent: {
          DEFAULT: '#F1C40F',
          foreground: '#2D3436',
        },
        background: '#FFF5E6',
        foreground: '#2D3436',
      },

      // Typographie
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Nunito', 'system-ui', '-apple-system', 'sans-serif'],
      },

      fontSize: {
        // Scale de typography PNAVIM
        'hero': ['56px', {
          lineHeight: '1.1',
          fontWeight: '800',
          letterSpacing: '-0.02em',
        }],
        'h1': ['48px', {
          lineHeight: '1.1',
          fontWeight: '800',
        }],
        'h2': ['40px', {
          lineHeight: '1.2',
          fontWeight: '700',
        }],
        'h3': ['32px', {
          lineHeight: '1.3',
          fontWeight: '700',
        }],
        'h4': ['24px', {
          lineHeight: '1.4',
          fontWeight: '600',
        }],
        'h5': ['20px', {
          lineHeight: '1.5',
          fontWeight: '600',
        }],
        'body-xl': ['20px', {
          lineHeight: '1.6',
          fontWeight: '400',
        }],
        'body': ['18px', {
          lineHeight: '1.6',
          fontWeight: '400',
        }],
        'body-sm': ['16px', {
          lineHeight: '1.5',
          fontWeight: '400',
        }],
        'caption': ['14px', {
          lineHeight: '1.4',
          fontWeight: '500',
        }],
        'button': ['18px', {
          lineHeight: '1',
          fontWeight: '600',
        }],
      },

      // Ombres personnalisées PNAVIM
      boxShadow: {
        'terre': '0 4px 14px 0 rgba(194, 94, 0, 0.39)',
        'terre-lg': '0 10px 24px 0 rgba(194, 94, 0, 0.39)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
        'glass-lg': '0 16px 48px 0 rgba(0, 0, 0, 0.2)',
        'soft': '0 2px 8px 0 rgba(45, 52, 54, 0.1)',
        'glow': '0 0 20px rgba(241, 196, 15, 0.5)',
      },

      // Backdrop blur pour glassmorphism
      backdropBlur: {
        'glass': '16px',
        'glass-sm': '8px',
        'glass-lg': '24px',
      },

      // Border radius personnalisés
      borderRadius: {
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
        'pill': '9999px',
      },

      // Animations personnalisées
      keyframes: {
        'pulse-micro': {
          '0%, 100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
          '50%': {
            transform: 'scale(1.05)',
            opacity: '0.8',
          },
        },
        'slide-up': {
          '0%': {
            transform: 'translateY(20px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'slide-down': {
          '0%': {
            transform: 'translateY(-20px)',
            opacity: '0',
          },
          '100%': {
            transform: 'translateY(0)',
            opacity: '1',
          },
        },
        'fade-in': {
          '0%': {
            opacity: '0',
          },
          '100%': {
            opacity: '1',
          },
        },
        'scale-in': {
          '0%': {
            transform: 'scale(0.9)',
            opacity: '0',
          },
          '100%': {
            transform: 'scale(1)',
            opacity: '1',
          },
        },
      },
      animation: {
        'pulse-micro': 'pulse-micro 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.3s ease-out',
      },

      // Spacing personnalisé (basé sur 8px)
      spacing: {
        '18': '4.5rem',   // 72px
        '88': '22rem',    // 352px
        '112': '28rem',   // 448px
        '128': '32rem',   // 512px
      },

      // Z-index personnalisés
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },

      // Gradients personnalisés (via backgroundImage)
      backgroundImage: {
        'gradient-terre': 'linear-gradient(135deg, #E67E22 0%, #C25E00 50%, #F39C12 100%)',
        'gradient-soleil': 'linear-gradient(to bottom right, #D35400 0%, #E67E22 30%, #F39C12 100%)',
        'gradient-nature': 'linear-gradient(135deg, #27AE60 0%, #2E7D32 100%)',
        'gradient-moutarde': 'linear-gradient(135deg, #F1C40F 0%, #F39C12 100%)',
        'gradient-overlay': 'linear-gradient(to bottom right, rgba(211, 84, 0, 0.4), rgba(230, 126, 34, 0.3), rgba(46, 125, 50, 0.35))',
      },

      // Transitions
      transitionDuration: {
        '400': '400ms',
      },
      transitionTimingFunction: {
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
```

## 🎨 Classes Utilitaires Personnalisées

### `src/index.css` ou `src/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import Google Fonts */
@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');

/* Base Styles PNAVIM */
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-pnavim-sable text-pnavim-charbon font-sans text-body antialiased;
  }

  h1, h2, h3, h4, h5, h6 {
    @apply font-display;
  }

  h1 {
    @apply text-h1;
  }

  h2 {
    @apply text-h2;
  }

  h3 {
    @apply text-h3;
  }

  h4 {
    @apply text-h4;
  }

  h5 {
    @apply text-h5;
  }
}

/* Components Layer - Composants réutilisables */
@layer components {

  /* Boutons PNAVIM */
  .btn-primary {
    @apply bg-gradient-terre text-white font-semibold text-button
           px-8 py-4 rounded-pill
           shadow-terre hover:shadow-terre-lg
           transform hover:scale-105
           transition-all duration-300
           border-2 border-white/30;
  }

  .btn-secondary {
    @apply bg-white/90 backdrop-blur-md text-pnavim-terre font-semibold text-button
           px-8 py-4 rounded-pill
           border-2 border-pnavim-orange/50
           shadow-lg hover:shadow-xl
           transform hover:scale-105
           transition-all duration-300;
  }

  .btn-success {
    @apply bg-gradient-nature text-white font-semibold text-button
           px-8 py-4 rounded-pill
           shadow-xl hover:shadow-2xl
           transform hover:scale-105
           transition-all duration-300;
  }

  .btn-micro {
    @apply bg-gradient-terre text-white
           w-24 h-24 rounded-full
           shadow-2xl
           flex items-center justify-center
           animate-pulse-micro hover:animate-none
           transform hover:scale-110
           transition-all duration-300;
  }

  /* Cards PNAVIM */
  .card-glass {
    @apply backdrop-blur-xl bg-white/90
           rounded-3xl p-8
           shadow-glass-lg
           border-2 border-white/30
           relative overflow-hidden;
  }

  .card-terre {
    @apply backdrop-blur-xl bg-gradient-terre
           rounded-3xl p-8
           shadow-2xl
           border-2 border-pnavim-or/30
           relative overflow-hidden
           text-white;
  }

  /* Inputs PNAVIM */
  .input-pnavim {
    @apply w-full
           bg-white/90 backdrop-blur-md
           border-2 border-pnavim-orange/30
           rounded-2xl
           px-6 py-4
           text-lg text-pnavim-charbon
           placeholder:text-pnavim-charbon-light
           focus:border-pnavim-terre
           focus:ring-4 focus:ring-pnavim-orange/20
           focus:outline-none
           transition-all duration-300
           shadow-lg;
  }

  /* Badges PNAVIM */
  .badge-important {
    @apply inline-flex items-center gap-2
           bg-gradient-moutarde
           text-yellow-900
           px-4 py-2 rounded-pill
           text-sm font-bold
           shadow-lg
           border-2 border-yellow-500/50;
  }

  .badge-success {
    @apply inline-flex items-center gap-2
           bg-pnavim-manioc
           text-white
           px-4 py-2 rounded-pill
           text-sm font-semibold
           shadow-lg;
  }

  /* Pattern Overlay */
  .pattern-overlay {
    @apply absolute inset-0 pointer-events-none opacity-10;
  }

  /* Glassmorphism preset */
  .glass-light {
    @apply backdrop-blur-md bg-white/80 border border-white/20;
  }

  .glass-medium {
    @apply backdrop-blur-lg bg-white/85 border-2 border-white/25;
  }

  .glass-strong {
    @apply backdrop-blur-xl bg-white/90 border-2 border-white/30;
  }
}

/* Utilities Layer */
@layer utilities {
  /* Text shadows */
  .text-shadow-sm {
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  .text-shadow {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .text-shadow-lg {
    text-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  .text-shadow-xl {
    text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.5);
  }

  /* Scrollbar personnalisé */
  .scrollbar-pnavim::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .scrollbar-pnavim::-webkit-scrollbar-track {
    background: rgba(194, 94, 0, 0.1);
    border-radius: 4px;
  }

  .scrollbar-pnavim::-webkit-scrollbar-thumb {
    background: rgba(194, 94, 0, 0.5);
    border-radius: 4px;
  }

  .scrollbar-pnavim::-webkit-scrollbar-thumb:hover {
    background: rgba(194, 94, 0, 0.7);
  }

  /* Filter presets */
  .filter-warm {
    filter: brightness(0.85) saturate(1.3);
  }
}

/* Animations personnalisées */
@keyframes pulse-micro {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
}
```

## 🎯 Exemples d'Usage

### Bouton CTA Principal

```tsx
<button className="btn-primary">
  Je suis Marchand
</button>
```

### Card Glassmorphism avec Pattern

```tsx
<div className="card-glass">
  {/* Pattern overlay */}
  <div className="pattern-overlay text-pnavim-terre">
    <AfricanPattern variant="geometric" />
  </div>

  {/* Contenu */}
  <div className="relative z-10">
    <h3 className="text-h3 mb-4">Mon Solde</h3>
    <p className="text-body-xl">125 000 F CFA</p>
  </div>
</div>
```

### Input avec Icône

```tsx
<div className="relative">
  <input
    type="text"
    placeholder="Votre nom"
    className="input-pnavim pl-14"
  />
  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pnavim-terre">
    <User className="w-6 h-6" />
  </div>
</div>
```

### Background avec Overlay

```tsx
<div className="relative min-h-screen overflow-hidden">
  {/* Image de fond */}
  <div
    className="absolute inset-0 bg-cover bg-center filter-warm"
    style={{ backgroundImage: 'url(/marche-ivoirien.jpg)' }}
  />

  {/* Overlay gradient */}
  <div className="absolute inset-0 bg-gradient-overlay" />

  {/* Contenu */}
  <div className="relative z-10">
    {/* Votre contenu ici */}
  </div>
</div>
```

## 📱 Responsive Design

### Breakpoints Standards

```javascript
// Tailwind breakpoints par défaut (à utiliser)
sm: '640px',   // Mobile large / Tablet portrait
md: '768px',   // Tablet
lg: '1024px',  // Desktop
xl: '1280px',  // Desktop large
2xl: '1536px', // Desktop XL
```

### Exemple Responsive

```tsx
<div className="
  grid gap-4
  grid-cols-1           /* Mobile: 1 colonne */
  sm:grid-cols-2        /* Tablet: 2 colonnes */
  lg:grid-cols-3        /* Desktop: 3 colonnes */
">
  {/* Cards ici */}
</div>

<h1 className="
  text-h3               /* Mobile: 32px */
  md:text-h2            /* Tablet: 40px */
  lg:text-hero          /* Desktop: 56px */
">
  Titre Responsive
</h1>
```

## 🎨 Palette VSCode (Optionnel)

Pour faciliter le développement, ajoutez ces couleurs dans votre `.vscode/settings.json` :

```json
{
  "workbench.colorCustomizations": {
    "[Default Dark+]": {
      "activityBar.background": "#C25E00",
      "titleBar.activeBackground": "#E67E22"
    }
  }
}
```

## ✅ Checklist d'Implémentation

- [ ] Installer Tailwind CSS et dépendances
- [ ] Copier la configuration `tailwind.config.js`
- [ ] Créer/Mettre à jour `globals.css` avec les styles personnalisés
- [ ] Importer Google Fonts (Nunito + Inter)
- [ ] Tester les classes utilitaires (`.btn-primary`, `.card-glass`)
- [ ] Créer le composant `AfricanPattern`
- [ ] Valider les couleurs sur plusieurs écrans
- [ ] Tester le responsive design

---

**✨ Configuration prête à l'emploi pour PNAVIM - "L'Âme du Marché"**
