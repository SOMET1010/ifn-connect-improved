# 🎨 CHARTE GRAPHIQUE PNAVIM V1.0

**"L'Âme du Marché - Digital Tontine"**

---

## 📋 SOMMAIRE

1. [Philosophie Visuelle](#1-philosophie-visuelle)
2. [Palette de Couleurs](#2-palette-de-couleurs)
3. [Typographie](#3-typographie)
4. [Identité Visuelle & Textures](#4-identité-visuelle--textures)
5. [UI Kit - Composants](#5-ui-kit---composants)
6. [Mascottes & Personnages](#6-mascottes--personnages)
7. [Mise en Page Type](#7-mise-en-page-type)
8. [Configuration Technique](#8-configuration-technique)
9. [Do's & Don'ts](#9-dos--donts)

---

## 1. PHILOSOPHIE VISUELLE

### Mots-clés
**Chaleur • Terre • Proximité • Solidité • Authenticité**

### Le Concept
> "Le Digital qui a la couleur de la terre"

Nous créons une interface qui respire l'authenticité des marchés ivoiriens tout en offrant une expérience moderne et premium. On s'éloigne du "Bleu Banque" froid pour embrasser les teintes des marchés (épices, terre battue, pagnes), traitées avec une finition "Glassmorphism" moderne.

### Principes de Design

1. **Chaleur Visuelle** : Utiliser des couleurs chaudes (orange, terre, jaune)
2. **Textures Authentiques** : Motifs africains en filigrane (jamais de fonds plats)
3. **Profondeur** : Glassmorphism + ombres fortes pour créer de la profondeur
4. **Accessibilité** : Grande typographie, contrastes forts, icônes XXL
5. **Humanité** : Mascottes 3D au lieu de texte froid

---

## 2. PALETTE DE COULEURS

### 🎨 Couleurs Principales

| Rôle | Nom | Code HEX | RGB | Usage |
|------|-----|----------|-----|-------|
| **Primary** | Terre Battue | `#C25E00` | `194, 94, 0` | Boutons principaux, En-têtes, CTAs |
| **Primary Light** | Orange Sanguine | `#E67E22` | `230, 126, 34` | Dégradés, Hover states |
| **Primary Dark** | Terre Profonde | `#A04000` | `160, 64, 0` | Texte sur fond clair, Bordures |
| **Success** | Vert Manioc | `#2E7D32` | `46, 125, 50` | Validation, Succès, Solde positif |
| **Success Light** | Vert Feuille | `#4CAF50` | `76, 175, 80` | Hover success |
| **Accent** | Jaune Moutarde | `#F1C40F` | `241, 196, 15` | Badges, Étoiles, Highlights |
| **Accent Alt** | Or Pagne | `#F39C12` | `243, 156, 18` | Texte important, Titres secondaires |
| **Background** | Sable Chaud | `#FFF5E6` | `255, 245, 230` | Fond de page (remplace le blanc) |
| **Text Primary** | Charbon Doux | `#2D3436` | `45, 52, 54` | Texte principal |
| **Text Secondary** | Terre Grise | `#636E72` | `99, 110, 114` | Texte secondaire |

### 🌈 Dégradés Signature

#### Dégradé "Terre & Soleil" (Principal)
```css
background: linear-gradient(135deg, #E67E22 0%, #C25E00 50%, #F39C12 100%);
```
**Usage** : Boutons CTA, Headers, Cards importantes

#### Dégradé "Coucher de Soleil"
```css
background: linear-gradient(to bottom right, #D35400 0%, #E67E22 30%, #F39C12 100%);
```
**Usage** : Fonds de page, Overlays

#### Dégradé "Nature"
```css
background: linear-gradient(135deg, #27AE60 0%, #2E7D32 100%);
```
**Usage** : Boutons de validation, Succès

---

## 3. TYPOGRAPHIE

### Principe de Lisibilité
Pour des utilisateurs peu habitués au digital, la police doit être :
- **Ronde** (non-agressive)
- **Large** (espacée)
- **Contrastée** (grasse pour les titres)

### 📝 Polices

#### Police Primaire : **Nunito**
- **Source** : Google Fonts
- **Caractéristiques** : Arrondie, chaleureuse, sympathique
- **Graisses disponibles** : 400 (Regular), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- **Usage** :
  - Titres principaux : 800 (ExtraBold)
  - Titres secondaires : 700 (Bold)
  - Sous-titres : 600 (SemiBold)

#### Police Secondaire : **Inter**
- **Source** : Google Fonts
- **Caractéristiques** : Très lisible sur petits écrans, moderne
- **Graisses disponibles** : 400 (Regular), 500 (Medium), 600 (SemiBold)
- **Usage** :
  - Corps de texte : 400 (Regular)
  - Labels : 500 (Medium)
  - Boutons : 600 (SemiBold)

### 📏 Échelle de Typographie

| Élément | Taille | Graisse | Police | Line Height | Usage |
|---------|--------|---------|--------|-------------|-------|
| H1 (Hero) | 56px / 3.5rem | 800 | Nunito | 1.1 | Titre principal page d'accueil |
| H2 | 40px / 2.5rem | 700 | Nunito | 1.2 | Titres de sections |
| H3 | 32px / 2rem | 700 | Nunito | 1.3 | Sous-titres |
| H4 | 24px / 1.5rem | 600 | Nunito | 1.4 | Titres de cards |
| Body Large | 20px / 1.25rem | 400 | Inter | 1.6 | Texte important |
| Body | 18px / 1.125rem | 400 | Inter | 1.6 | Texte principal |
| Body Small | 16px / 1rem | 400 | Inter | 1.5 | Texte secondaire |
| Caption | 14px / 0.875rem | 500 | Inter | 1.4 | Légendes |
| Button | 18px / 1.125rem | 600 | Inter | 1 | Texte de boutons |

**⚠️ RÈGLE ABSOLUE** : Jamais de texte en dessous de 16px (1rem)

---

## 4. IDENTITÉ VISUELLE & TEXTURES

### A. Le "Wax Digital" (Motifs Africains)

**PRINCIPE** : Ne jamais utiliser de fonds plats unis. Toujours ajouter une texture subtile.

#### Motifs Disponibles

1. **Motif Géométrique**
   - Triangles et losanges
   - Opacité : 5-10%
   - Couleur : Blanc sur fonds colorés, Terre (#C25E00) sur fonds clairs
   - Usage : Headers, Cards principales

2. **Motif Wax**
   - Cercles et courbes organiques
   - Opacité : 5-15%
   - Usage : Fonds de boutons, Overlays

3. **Motif Kente**
   - Bandes horizontales/verticales
   - Opacité : 10%
   - Usage : Footers, Cartes secondaires

#### Implémentation CSS
```css
.pattern-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.1;
  background-image: url('data:image/svg+xml,...');
  /* ou utiliser le component AfricanPattern */
}
```

### B. Glassmorphism (Effet Verre Dépoli)

**Style Signature PNAVIM**

```css
.glass-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.15);
}
```

**Variantes** :
- **Carte Légère** : `bg-white/90` + `backdrop-blur-md`
- **Carte Forte** : `bg-white/95` + `backdrop-blur-xl`
- **Carte Colorée** : `bg-orange-500/80` + `backdrop-blur-xl`

### C. Ombres & Profondeur

| Niveau | Shadow | Usage |
|--------|--------|-------|
| **Minimal** | `shadow-sm` | Texte, Petits éléments |
| **Défaut** | `shadow-lg` | Cards, Inputs |
| **Élevé** | `shadow-xl` | Boutons CTA, Modals |
| **Maximum** | `shadow-2xl` | Cards flottantes, Hero elements |

**Custom Shadow "Terre"** :
```css
box-shadow: 0 4px 14px 0 rgba(194, 94, 0, 0.39);
```

---

## 5. UI KIT - COMPOSANTS

### 🔘 Boutons

#### Bouton Principal (CTA)
```tsx
<button className="
  bg-gradient-to-r from-[#E67E22] to-[#C25E00]
  hover:from-[#D35400] hover:to-[#A04000]
  text-white font-semibold text-lg
  px-8 py-4
  rounded-full
  shadow-xl hover:shadow-2xl
  transform hover:scale-105
  transition-all duration-300
  border-2 border-white/30
">
  Action Principale
</button>
```

**Caractéristiques** :
- Forme "Pilule" (`rounded-full`)
- Dégradé Terre & Soleil
- Ombre forte pour effet "pressable"
- Animation hover : scale + shadow

#### Bouton Secondaire
```tsx
<button className="
  bg-white/90 backdrop-blur-md
  text-[#C25E00] font-semibold text-lg
  px-8 py-4
  rounded-full
  border-2 border-[#E67E22]/50
  shadow-lg hover:shadow-xl
  transform hover:scale-105
  transition-all duration-300
">
  Action Secondaire
</button>
```

#### Bouton Succès
```tsx
<button className="
  bg-gradient-to-r from-[#4CAF50] to-[#2E7D32]
  text-white font-semibold text-lg
  px-8 py-4
  rounded-full
  shadow-xl
  transform hover:scale-105
  transition-all duration-300
">
  Valider
</button>
```

#### Bouton Vocal (Micro)
```tsx
<button className="
  bg-gradient-to-r from-[#E67E22] to-[#C25E00]
  text-white
  w-24 h-24
  rounded-full
  shadow-2xl
  flex items-center justify-center
  animate-pulse
  hover:animate-none
  transform hover:scale-110
  transition-all duration-300
">
  <Mic className="w-12 h-12" />
</button>
```

**Animation Pulse pour l'écoute active** :
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}
```

### 🎴 Cards

#### Card Glassmorphism Standard
```tsx
<div className="
  backdrop-blur-xl bg-white/90
  rounded-3xl
  p-8
  shadow-2xl
  border-2 border-white/30
  relative overflow-hidden
">
  {/* Motif Wax en arrière-plan */}
  <div className="absolute inset-0 text-[#C25E00] opacity-5 pointer-events-none">
    <AfricanPattern variant="geometric" />
  </div>

  {/* Contenu */}
  <div className="relative z-10">
    {/* Votre contenu ici */}
  </div>
</div>
```

#### Card Colorée (Orange Terre)
```tsx
<div className="
  backdrop-blur-xl
  bg-gradient-to-br from-[#E67E22] to-[#C25E00]
  rounded-3xl
  p-8
  shadow-2xl
  border-2 border-[#F39C12]/30
  relative overflow-hidden
">
  {/* Motif en blanc */}
  <div className="absolute inset-0 text-white opacity-10 pointer-events-none">
    <AfricanPattern variant="wax" />
  </div>

  {/* Contenu en blanc */}
  <div className="relative z-10 text-white">
    {/* Votre contenu ici */}
  </div>
</div>
```

### 🔢 Inputs

#### Input Standard
```tsx
<input className="
  w-full
  bg-white/90 backdrop-blur-md
  border-2 border-[#E67E22]/30
  rounded-2xl
  px-6 py-4
  text-lg text-[#2D3436]
  placeholder:text-[#636E72]
  focus:border-[#C25E00]
  focus:ring-4 focus:ring-[#E67E22]/20
  transition-all duration-300
  shadow-lg
" />
```

#### Input avec Icône
```tsx
<div className="relative">
  <input className="pl-14 ..." />
  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#C25E00]">
    <Icon className="w-6 h-6" />
  </div>
</div>
```

### 🏷️ Badges

#### Badge "Important"
```tsx
<span className="
  inline-flex items-center gap-2
  bg-gradient-to-r from-[#F1C40F] to-[#F39C12]
  text-yellow-900
  px-4 py-2
  rounded-full
  text-sm font-bold
  shadow-lg
  border-2 border-yellow-500/50
">
  ⭐ Important
</span>
```

#### Badge "Succès"
```tsx
<span className="
  inline-flex items-center gap-2
  bg-[#2E7D32]
  text-white
  px-4 py-2
  rounded-full
  text-sm font-semibold
  shadow-lg
">
  ✓ Validé
</span>
```

---

## 6. MASCOTTES & PERSONNAGES

### Principe
L'interface communique via des **personnages 3D** plutôt que du texte froid.

### 👩 Tantie Sagesse (Mascotte Principale)

**Description Visuelle** :
- Femme ivoirienne souriante, environ 45-55 ans
- Foulard coloré (pagne) sur la tête
- Tient un panier de produits frais OU un smartphone
- Vêtements : Pagne traditionnel ou tenue colorée moderne
- Expression : Chaleureuse, rassurante, maternelle

**Usage** :
- Page d'accueil
- Onboarding
- Section épargne
- Messages d'aide
- Conseils financiers

**Tons** :
- "Ma fille/mon fils, viens voir..."
- "Je suis là pour t'aider"
- "Bravo, tu as bien travaillé aujourd'hui!"

### 👨 Le Jeune (Mascotte Secondaire)

**Description Visuelle** :
- Jeune homme dynamique, 25-35 ans
- Polo ou t-shirt moderne
- Smartphone à la main
- Expression : Énergique, moderne, connecté

**Usage** :
- Transactions rapides
- Notifications
- Mode "Cash Register"
- Tutoriels techniques

**Tons** :
- "Go, on encaisse vite!"
- "Transaction réussie mon gars!"
- "C'est bon, c'est envoyé"

### 🎨 Spécifications Techniques

**Format** : PNG avec fond transparent
**Taille** : 512x512px minimum (pour haute résolution)
**Style** : 3D cartoon, couleurs vives, ombres douces
**Poses** :
- Neutre (salut de la main)
- Pointer du doigt
- Pouce levé (succès)
- Réflexion (main sur le menton)
- Célébration (bras levés)

---

## 7. MISE EN PAGE TYPE

### 🏠 Page d'Accueil (Home)

```
┌─────────────────────────────────────────┐
│ [Header avec motif géométrique orange]  │ ← Motif Wax
│              PNAVIM                      │
│         [Logo] [Bell Icon]              │
├─────────────────────────────────────────┤
│                                         │
│  [Photo marché floue + Overlay orange]  │ ← Background
│                                         │
│    ┌─────────────────────────────┐     │
│    │ [Card Glassmorphism]        │     │ ← Card centrale
│    │                             │     │
│    │   [Avatar Tantie Sagesse]   │     │ ← Avatar 3D
│    │         (3D, 200px)         │     │
│    │                             │     │
│    │      Bienvenue              │     │ ← Nunito 800, 56px
│    │   Je suis Marchand          │     │ ← Nunito 700, 40px, Jaune
│    │                             │     │
│    │  [🎙️ Cliquez pour écouter] │     │ ← Bouton vocal
│    │                             │     │
│    │    [Se connecter]           │     │ ← CTA vert
│    │                             │     │
│    └─────────────────────────────┘     │
│                                         │
└─────────────────────────────────────────┘
```

### 📊 Dashboard Marchand

```
┌─────────────────────────────────────────┐
│ [Header Orange avec pattern]            │
│  Bonjour [Nom]  👋  [Avatar]           │
├─────────────────────────────────────────┤
│                                         │
│ ┌──────────────┐  ┌──────────────┐    │ ← Cards Glassmorphism
│ │ Solde        │  │ Aujourd'hui  │    │
│ │ 125 000 F    │  │ 15 ventes    │    │
│ └──────────────┘  └──────────────┘    │
│                                         │
│ [🎙️ GROS BOUTON MICRO CENTRAL]        │ ← Bouton d'action principal
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ [Graph des ventes avec Terre color] ││
│ └─────────────────────────────────────┘│
│                                         │
│ [Navigation bottom: 5 icônes XXL]      │ ← Icônes 48px minimum
└─────────────────────────────────────────┘
```

### 🎯 Espacements Standard

| Zone | Padding/Margin | Usage |
|------|----------------|-------|
| Containers | `px-4` (16px) mobile, `px-8` (32px) desktop | Marges latérales |
| Sections | `py-12` (48px) mobile, `py-16` (64px) desktop | Espacement vertical |
| Cards | `p-6` (24px) mobile, `p-8` (32px) desktop | Padding intérieur |
| Entre éléments | `gap-4` (16px) | Espacement entre boutons, cards |
| Entre sections | `space-y-8` (32px) | Espacement vertical groupes |

---

## 8. CONFIGURATION TECHNIQUE

### A. Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        pnavim: {
          terre: '#C25E00',
          terreDark: '#A04000',
          orange: '#E67E22',
          orangeLight: '#F39C12',
          manioc: '#2E7D32',
          maniocLight: '#4CAF50',
          moutarde: '#F1C40F',
          or: '#F39C12',
          sable: '#FFF5E6',
          charbon: '#2D3436',
          gris: '#636E72',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Nunito', 'sans-serif'],
      },
      fontSize: {
        'hero': ['56px', { lineHeight: '1.1', fontWeight: '800' }],
        'h2': ['40px', { lineHeight: '1.2', fontWeight: '700' }],
        'h3': ['32px', { lineHeight: '1.3', fontWeight: '700' }],
        'h4': ['24px', { lineHeight: '1.4', fontWeight: '600' }],
      },
      boxShadow: {
        'terre': '0 4px 14px 0 rgba(194, 94, 0, 0.39)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
      },
      backdropBlur: {
        'glass': '16px',
      },
    },
  },
  plugins: [],
}
```

### B. Google Fonts Import

```html
<!-- Dans votre index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### C. CSS Global

```css
/* global.css */
:root {
  --color-terre: #C25E00;
  --color-orange: #E67E22;
  --color-manioc: #2E7D32;
  --color-moutarde: #F1C40F;
  --color-sable: #FFF5E6;
  --color-charbon: #2D3436;

  --font-display: 'Nunito', sans-serif;
  --font-body: 'Inter', sans-serif;
}

body {
  font-family: var(--font-body);
  background-color: var(--color-sable);
  color: var(--color-charbon);
  font-size: 18px;
  line-height: 1.6;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-display);
}

/* Animation Pulse pour micro */
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

.pulse-micro {
  animation: pulse-micro 2s ease-in-out infinite;
}
```

---

## 9. DO'S & DON'TS

### ✅ DO'S (À FAIRE)

1. **Toujours utiliser des couleurs chaudes** (orange, terre, jaune)
2. **Ajouter des motifs africains** en arrière-plan de chaque card (opacité 5-10%)
3. **Utiliser le glassmorphism** pour les cards flottantes
4. **Boutons en forme de pilule** (`rounded-full`) pour les CTAs
5. **Ombres fortes** (`shadow-xl`, `shadow-2xl`) pour créer de la profondeur
6. **Icônes XXL** (minimum 32px, idéalement 48px) pour accessibilité
7. **Texte minimum 16px**, idéalement 18px pour le corps
8. **Utiliser Tantie Sagesse** pour rassurer et guider
9. **Animations douces** (300ms) sur les hovers et transitions
10. **Dégradés** pour tous les boutons principaux

### ❌ DON'TS (À ÉVITER)

1. **NE JAMAIS utiliser de bleu froid** (type banque)
2. **NE JAMAIS avoir des fonds plats** sans texture/motif
3. **NE JAMAIS utiliser de polices Serif** (trop formelles)
4. **NE JAMAIS avoir de texte sous 16px**
5. **NE JAMAIS utiliser de coins carrés** (toujours arrondis: `rounded-2xl`, `rounded-3xl`)
6. **NE JAMAIS surcharger** l'interface (principe de simplicité)
7. **NE JAMAIS utiliser de gris pur** (#808080) - toujours avec une teinte chaude
8. **NE JAMAIS avoir plus de 2 CTAs** par écran
9. **NE JAMAIS utiliser de blanc pur** (#FFFFFF) - préférer Sable (#FFF5E6)
10. **NE JAMAIS oublier les motifs** africains dans les zones importantes

---

## 📐 ANNEXES

### A. Composants React Réutilisables

#### Bouton CTA
```tsx
export function ButtonCTA({ children, onClick, variant = "primary" }) {
  const variants = {
    primary: "bg-gradient-to-r from-[#E67E22] to-[#C25E00] hover:from-[#D35400] hover:to-[#A04000]",
    success: "bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#43A047] hover:to-[#1B5E20]",
  };

  return (
    <button
      onClick={onClick}
      className={`
        ${variants[variant]}
        text-white font-semibold text-lg
        px-8 py-4
        rounded-full
        shadow-xl hover:shadow-2xl
        transform hover:scale-105
        transition-all duration-300
        border-2 border-white/30
      `}
    >
      {children}
    </button>
  );
}
```

#### Card Glassmorphism
```tsx
export function GlassCard({ children, pattern = "geometric", className = "" }) {
  return (
    <div className={`
      backdrop-blur-xl bg-white/90
      rounded-3xl
      p-8
      shadow-2xl
      border-2 border-white/30
      relative overflow-hidden
      ${className}
    `}>
      <div className="absolute inset-0 text-[#C25E00] opacity-5 pointer-events-none">
        <AfricanPattern variant={pattern} />
      </div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
```

### B. Exemples de Layouts

Voir le dossier `/design-examples` pour des mockups complets :
- `home-page.png` - Page d'accueil
- `dashboard-merchant.png` - Dashboard marchand
- `transaction-flow.png` - Flow de transaction

---

## 📝 CHANGELOG

### Version 1.0 (03 Janvier 2026)
- Création de la charte graphique initiale
- Définition de la palette "Terre & Soleil"
- Établissement des principes de design
- Documentation des composants UI

---

## 📞 CONTACT

Pour toute question sur l'application de cette charte :
- **Designer Lead** : [Nom]
- **Tech Lead** : [Nom]
- **Email** : design@pnavim.ci

---

**© 2026 PNAVIM - République de Côte d'Ivoire**
*Cette charte est un document vivant et sera mise à jour régulièrement.*
