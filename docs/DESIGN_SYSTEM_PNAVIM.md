# 🎨 Design System PNAVIM — L'Âme du Marché

**Version 1.0 - Design System Complet**

*"Le Digital qui a la couleur de la terre"*

---

## 📐 1. Design Tokens

### 1.1 Couleurs

#### Palette Primaire

| Token | Hex | Usage | Variable CSS |
|-------|-----|-------|--------------|
| **Terre Battue** | `#C25E00` | CTA principaux, headers, cartes actives | `--pnavim-terre` |
| **Orange Sanguine** | `#E67E22` | Dégradés, overlays, accents | `--pnavim-sanguine` |
| **Vert Manioc** | `#2E7D32` | Succès, validations, confirmations | `--pnavim-manioc` |
| **Jaune Moutarde** | `#F1C40F` | Alertes douces, badges importants | `--pnavim-moutarde` |
| **Sable Chaud** | `#FFF5E6` | Fond de page, espaces | `--pnavim-sable` |
| **Charbon Doux** | `#2D3436` | Texte principal | `--pnavim-charbon` |
| **Verre** | `rgba(255,255,255,0.85)` | Cards glassmorphism | `--pnavim-verre` |

#### Palette Secondaire

| Token | Hex | Usage |
|-------|-----|-------|
| **Terre Profonde** | `#A04000` | Hover états terre |
| **Vert Foncé** | `#1B5E20` | Hover états manioc |
| **Gris Doux** | `#636E72` | Texte secondaire |

### 1.2 Typographie

#### Familles de Polices

```css
--font-heading: 'Nunito', ui-sans-serif, system-ui, sans-serif;
--font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;
```

#### Échelle Typographique

| Niveau | Taille | Poids | Line Height | Usage |
|--------|--------|-------|-------------|-------|
| H1 | 48px / 3rem | 800 | 1.2 | Titres principaux |
| H2 | 36px / 2.25rem | 700 | 1.25 | Sections |
| H3 | 28px / 1.75rem | 700 | 1.3 | Sous-sections |
| H4 | 22px / 1.375rem | 600 | 1.4 | Cards |
| Body Large | 18px / 1.125rem | 400 | 1.6 | Texte important |
| Body | 16px / 1rem | 400 | 1.6 | Texte standard |
| Small | 14px / 0.875rem | 400 | 1.5 | Légendes |

**⚠️ Règle absolue** : Jamais de texte < 16px sur mobile

### 1.3 Espacements

**Système basé sur 8px** :

```
--space-1: 8px
--space-2: 16px
--space-3: 24px
--space-4: 32px
--space-5: 40px
--space-6: 48px
--space-8: 64px
--space-12: 96px
```

### 1.4 Ombres

```css
/* CTA Principal */
--shadow-pnavim-cta: 0 4px 14px rgba(194, 94, 0, 0.39);

/* Cards */
--shadow-pnavim-card: 0 8px 32px rgba(0, 0, 0, 0.12);

/* Cards Hover */
--shadow-pnavim-card-hover: 0 16px 48px rgba(0, 0, 0, 0.18);

/* Glassmorphism */
--shadow-glass: 0 8px 32px rgba(0, 0, 0, 0.1);
```

### 1.5 Dégradés

```css
/* CTA Terre */
--gradient-cta: linear-gradient(135deg, #E67E22, #C25E00);

/* Overlay Marché */
--gradient-overlay: linear-gradient(135deg, rgba(230,126,34,0.35), rgba(194,94,0,0.45));

/* Vert Succès */
--gradient-success: linear-gradient(135deg, #4CAF50, #2E7D32);

/* Moutarde */
--gradient-warning: linear-gradient(135deg, #F39C12, #F1C40F);
```

### 1.6 Bordures

```css
--radius-sm: 12px;    /* Petits éléments */
--radius-md: 16px;    /* Cards standard */
--radius-lg: 24px;    /* Cards importantes */
--radius-xl: 32px;    /* Hero sections */
--radius-full: 9999px; /* Boutons pilules */

--border-glass: 2px solid rgba(255, 255, 255, 0.25);
```

---

## 🔧 2. Configuration Tailwind

### 2.1 tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pnavim: {
          terre: "#C25E00",
          sanguine: "#E67E22",
          manioc: "#2E7D32",
          moutarde: "#F1C40F",
          sable: "#FFF5E6",
          charbon: "#2D3436",
          verre: "rgba(255,255,255,0.85)",
          terreProfond: "#A04000",
          vertFonce: "#1B5E20",
          grisDoux: "#636E72",
        }
      },
      fontFamily: {
        heading: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        body: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        'pnavim-cta': '0 4px 14px rgba(194, 94, 0, 0.39)',
        'pnavim-card': '0 8px 32px rgba(0, 0, 0, 0.12)',
        'pnavim-card-hover': '0 16px 48px rgba(0, 0, 0, 0.18)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
      },
      backgroundImage: {
        'pnavim-cta': 'linear-gradient(135deg, #E67E22, #C25E00)',
        'pnavim-overlay': 'linear-gradient(135deg, rgba(230,126,34,0.35), rgba(194,94,0,0.45))',
        'pnavim-success': 'linear-gradient(135deg, #4CAF50, #2E7D32)',
        'pnavim-warning': 'linear-gradient(135deg, #F39C12, #F1C40F)',
      },
      backdropBlur: {
        'pnavim': '24px',
      }
    }
  },
  plugins: []
}
```

### 2.2 CSS Variables

```css
:root {
  /* Couleurs */
  --pnavim-terre: #C25E00;
  --pnavim-sanguine: #E67E22;
  --pnavim-manioc: #2E7D32;
  --pnavim-moutarde: #F1C40F;
  --pnavim-sable: #FFF5E6;
  --pnavim-charbon: #2D3436;
  --pnavim-verre: rgba(255,255,255,0.85);

  /* Typographie */
  --font-heading: 'Nunito', ui-sans-serif, system-ui, sans-serif;
  --font-body: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Espacements */
  --space-1: 8px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-8: 64px;
  --space-12: 96px;
}
```

---

## 📦 3. Composants UI Kit

### 3.1 Bouton CTA "Pilule"

#### Code React + Tailwind

```tsx
<button className="
  rounded-full
  bg-pnavim-cta
  shadow-pnavim-cta
  hover:shadow-pnavim-card-hover
  text-white
  font-heading font-bold
  text-lg
  h-14
  px-8
  transform hover:scale-105
  active:scale-95
  transition-all duration-300
  border-2 border-white/30
">
  🎙️ Appuyer pour parler
</button>
```

#### Variantes

**Succès (Vert Manioc)**
```tsx
className="bg-pnavim-success text-white"
```

**Alerte (Moutarde)**
```tsx
className="bg-pnavim-warning text-pnavim-charbon"
```

**Secondaire (Outline)**
```tsx
className="bg-transparent border-2 border-pnavim-terre text-pnavim-terre hover:bg-pnavim-terre hover:text-white"
```

### 3.2 Carte Glass

```tsx
<div className="
  bg-white/85
  backdrop-blur-md
  border-2 border-white/25
  rounded-2xl
  p-6
  shadow-glass
  hover:shadow-pnavim-card-hover
  transition-shadow duration-300
  relative overflow-hidden
">
  {/* Motif Wax optionnel */}
  <div className="absolute inset-0 opacity-[0.06] pointer-events-none">
    <AfricanPattern variant="geometric" />
  </div>

  {/* Contenu */}
  <div className="relative z-10">
    ...
  </div>
</div>
```

### 3.3 Badge "Validé"

```tsx
<span className="
  inline-flex items-center gap-2
  rounded-full
  bg-pnavim-manioc/15
  text-pnavim-manioc
  px-3 py-1
  text-sm font-semibold
">
  ✅ Validé
</span>
```

**Variantes**
- Alerte : `bg-pnavim-moutarde/15 text-pnavim-moutarde`
- Important : `bg-pnavim-terre/15 text-pnavim-terre`

### 3.4 Motif Wax

#### Composant React

```tsx
export function WaxPattern({ opacity = 0.06 }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ opacity }}
    >
      <div
        className="w-full h-full"
        style={{
          backgroundImage: 'url(/wax-pattern.svg)',
          backgroundRepeat: 'repeat',
          backgroundSize: '280px',
        }}
      />
    </div>
  );
}
```

#### Usage

```tsx
<div className="relative">
  <WaxPattern opacity={0.08} />
  <div className="relative z-10">
    {/* Contenu */}
  </div>
</div>
```

### 3.5 Background Marché

```tsx
<div className="min-h-screen relative overflow-hidden">
  {/* Image marché */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: 'url(/marche-ivoirien.jpg)',
      filter: 'brightness(0.85) saturate(1.3) contrast(1.05)',
    }}
  />

  {/* Overlay dégradé */}
  <div className="absolute inset-0 bg-pnavim-overlay" />

  {/* Contenu */}
  <div className="relative z-10">
    ...
  </div>
</div>
```

### 3.6 Bouton Vocal avec Animation

```tsx
<button className="
  relative
  rounded-full
  bg-pnavim-cta
  shadow-pnavim-cta
  text-white
  h-16 w-16
  flex items-center justify-center
  transition-all duration-300
  group
">
  {/* Animation pulse quand actif */}
  <span className="
    absolute inset-0
    rounded-full
    bg-pnavim-terre/50
    animate-ping
    group-hover:animate-pulse
  " />

  {/* Icône */}
  <svg className="relative z-10 w-8 h-8" /* ... */>
    {/* Micro SVG */}
  </svg>
</button>
```

---

## 🚨 4. Règles UI Non Négociables

### 4.1 Fond "Marché" (Obligatoire sur pages clés)

✅ **À FAIRE**
- Pages d'entrée (Home, Login)
- Pages d'actions principales (Dashboard, Caisse)
- Image marché floutée + overlay dégradé

❌ **INTERDIT**
- Fond blanc plat sur pages d'entrée
- Fond gris neutre sans texture

### 4.2 "Wax Digital" (Texture)

✅ **À FAIRE**
- Motif géométrique en filigrane
- Opacity : 5-10%
- Sur : headers, hero, cartes principales

❌ **INTERDIT**
- Motif trop visible (>15%)
- Absence de motif sur hero principal

### 4.3 CTA "Pilule"

✅ **À FAIRE**
- `rounded-full`
- Dégradé terre
- Ombre forte
- Hauteur min : 52px (mobile)
- Texte : 18-20px

❌ **INTERDIT**
- Boutons rectangulaires sur CTA principaux
- Boutons sans ombre
- Texte < 16px

### 4.4 Cartes "Glassmorphism"

✅ **À FAIRE**
- `bg-white/85 backdrop-blur-md`
- `border border-white/25`
- `rounded-2xl` minimum
- Ombre douce

❌ **INTERDIT**
- Cards plates sans effet verre
- Cards avec fond 100% opaque blanc
- Coins carrés

### 4.5 Icône Microphone

✅ **À FAIRE**
- Toujours visible sur écrans marchands
- Animation pulse quand écoute active
- Taille min : 48x48px (zone tactile)

❌ **INTERDIT**
- Micro caché dans un menu
- Pas d'animation de feedback

---

## 📋 5. Spécification Écran "Accueil Rôles"

### 5.1 Structure

```
┌─────────────────────────────────────────────────────┐
│ [Header PNAVIM]                                     │
│  Logo - Nav - Langue - Se connecter                 │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Background Marché + Overlay]                      │
│                                                     │
│  ┌──────────────────────────────┐  ┌──────────┐   │
│  │ Je suis Marchand             │  │ Agent    │   │
│  │                              │  │ terrain  │   │
│  │ Encaisser, vendre, épargner  │  └──────────┘   │
│  │                              │                  │
│  │            [Tantie 3D] ────>│                  │
│  │                              │  ┌──────────┐   │
│  │ [🎙️ Cliquez pour écouter]   │  │Coopérat. │   │
│  └──────────────────────────────┘  └──────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

### 5.2 Interactions

**Bouton Audio** :
- État `idle` : Icône play + texte "Cliquez pour écouter"
- État `listening` : Animation pulse + onde sonore
- État `playing` : Icône pause + indicateur audio

**Hover** :
- Cards : `scale-105` + ombre plus forte
- Tantie : `scale-105` rotation subtile

---

## 🎯 6. Prompt Lovable (Génération d'écrans)

### 6.1 Template Prompt

```
Génère une page PNAVIM-CI (React + Tailwind + shadcn/ui)
conforme au Design System "L'Âme du Marché".

STYLE GLOBAL
- Palette : Terre #C25E00, Sanguine #E67E22, Sable #FFF5E6,
  Charbon #2D3436, Manioc #2E7D32
- Look : chaleur + modernité glassmorphism
- Typo : Nunito (titres 800), Inter (body >=16px)
- Motif Wax Digital en filigrane (opacity 6-8%)

FOND DE PAGE
- Background : photo marché floutée + overlay dégradé orange
- Jamais de fond blanc plat

LAYOUT
[Décrire la structure spécifique]

COMPOSANTS REQUIS
- Boutons CTA : rounded-full, gradient terre, shadow forte
- Cards : glassmorphism (bg-white/85 backdrop-blur-md)
- Texte : min 16px, jamais moins

COMPORTEMENTS
[Décrire les interactions]

ACCESSIBILITÉ & MOBILE
- Mobile-first, cards empilées sur petit écran
- Zones tactiles >= 48px
- Contrastes WCAG AA minimum

RÉSULTAT
Page chaleureuse, moderne, "digital couleur de la terre"
```

### 6.2 Prompt Spécifique "Page d'Accueil"

```
Génère une page d'accueil PNAVIM-CI (React + Tailwind + shadcn/ui)
conforme au Design System "L'Âme du Marché".

STYLE GLOBAL
- Palette : Terre #C25E00, Sanguine #E67E22, Sable #FFF5E6,
  Charbon #2D3436, Manioc #2E7D32
- Look : chaleur + glassmorphism
- Typo : Nunito (titres 800), Inter (body >=16px)
- Motif Wax en filigrane (opacity 6-8%)

FOND
- Photo marché floutée + overlay orange dégradé
- Filtre : brightness(0.85) saturate(1.3)

LAYOUT
- Header : Logo PNAVIM-CI, nav minimal, langue, Se connecter
- Hero central : grande card glass avec :
  * H1 : "Je suis Marchand"
  * Sous-texte : "Encaisser, vendre et épargner"
  * Personnage 3D "Tantie Sagesse" (déborde à droite)
  * CTA pilule : "🎙️ Cliquez pour écouter"
    (gradient #E67E22→#C25E00, shadow forte)
- Colonne droite : 2 cards glass plus petites
  * "Agent terrain" + vignette + play
  * "Coopérative" idem

COMPORTEMENTS
- CTA micro : animation pulse quand actif
- Composant VoiceHeroButton avec états idle/listening/playing

MOBILE
- Cards de droite passent sous le hero
- Boutons >= 48px

RÉSULTAT
Page d'accueil chaleureuse, moderne, avec héros vocal
et mascottes 3D
```

---

## 🛡️ 7. Checklist Anti-Dérive

### 7.1 Avant de Pusher

- [ ] Pas de boutons rectangulaires sur CTA principaux
- [ ] Pas de fond blanc plat sur pages d'entrée
- [ ] Au moins 1 élément "matière" (wax OU photo floutée)
- [ ] Texte minimum 16px partout
- [ ] Cards glassmorphism (pas de fond opaque)
- [ ] Hiérarchie : 1 grand CTA + 2-3 secondaires max
- [ ] Ombres fortes sur CTA
- [ ] Animations douces (300ms)

### 7.2 Code Review

**Question à se poser** :
1. Est-ce que ça respire "marché ivoirien" ?
2. Y a-t-il de la chaleur visuelle ?
3. Les boutons sont-ils assez gros ?
4. Les contrastes sont-ils suffisants ?
5. Le glassmorphism est-il présent ?

**Si NON à l'une de ces questions → REVOIR**

### 7.3 Tests Visuels

#### Test "5 secondes"
Montrer l'écran 5 secondes :
- Ressenti : "C'est chaud" ou "C'est froid" ?
- Si "froid" → Ajouter overlay orange + motif wax

#### Test "Contraste"
- Utiliser WebAIM Contrast Checker
- Minimum AA (4.5:1) pour texte normal
- Minimum AAA (7:1) pour texte important

#### Test "Touch Target"
- Tous les boutons >= 48x48px sur mobile
- Espacement entre boutons >= 8px

---

## 📚 8. Exemples de Code

### 8.1 Page Type "Hero + Cards"

```tsx
export default function MerchantDashboard() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background marché */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/marche-ivoirien.jpg)',
          filter: 'brightness(0.85) saturate(1.3)',
        }}
      />
      <div className="absolute inset-0 bg-pnavim-overlay" />

      {/* Contenu */}
      <div className="relative z-10 min-h-screen flex flex-col">
        <Header />

        <main className="flex-1 container py-12">
          {/* Hero avec Tantie */}
          <div className="text-center mb-12">
            <img
              src="/suta-avatar-3d.png"
              alt="Tantie Sagesse"
              className="w-32 h-32 mx-auto mb-6"
            />
            <div className="bg-white/85 backdrop-blur-md border-2 border-white/25 rounded-3xl px-8 py-6 inline-block shadow-glass relative">
              <WaxPattern opacity={0.06} />
              <div className="relative z-10">
                <h1 className="text-5xl font-heading font-bold text-pnavim-charbon mb-2">
                  Bonjour Patrick ! 👋
                </h1>
                <p className="text-2xl text-pnavim-grisDoux">
                  Que veux-tu faire aujourd'hui ?
                </p>
              </div>
            </div>
          </div>

          {/* Grid Actions */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {actions.map(action => (
              <button
                key={action.id}
                className="
                  bg-white/85 backdrop-blur-md
                  border-2 border-white/25
                  rounded-2xl p-12
                  shadow-pnavim-card
                  hover:shadow-pnavim-card-hover
                  transform hover:scale-105
                  transition-all duration-300
                  relative overflow-hidden
                "
              >
                <WaxPattern opacity={0.08} />
                <div className="relative z-10">
                  <action.icon className="w-24 h-24 mx-auto mb-4 text-pnavim-terre" />
                  <h2 className="text-4xl font-heading font-black text-pnavim-charbon">
                    {action.title}
                  </h2>
                </div>
              </button>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
```

### 8.2 Composant Bouton Vocal

```tsx
export function VoiceButton({
  state = 'idle', // idle | listening | playing
  onClick
}) {
  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-full
        bg-pnavim-cta shadow-pnavim-cta
        text-white font-heading font-bold
        h-16 px-8
        flex items-center gap-3
        transform hover:scale-105 active:scale-95
        transition-all duration-300
        border-2 border-white/30
        ${state === 'listening' ? 'animate-pulse' : ''}
      `}
    >
      {/* Animation pulse si listening */}
      {state === 'listening' && (
        <span className="absolute inset-0 rounded-full bg-pnavim-terre/50 animate-ping" />
      )}

      {/* Icône */}
      <div className="relative z-10 flex items-center gap-3">
        {state === 'idle' && <Mic className="w-6 h-6" />}
        {state === 'listening' && <AudioWaveform className="w-6 h-6" />}
        {state === 'playing' && <Volume2 className="w-6 h-6" />}

        <span className="text-lg">
          {state === 'idle' && 'Appuyer pour parler'}
          {state === 'listening' && 'Écoute...'}
          {state === 'playing' && 'Lecture...'}
        </span>
      </div>
    </button>
  );
}
```

---

## 🎓 9. Formation Équipe

### 9.1 Onboarding Designer

**Jour 1 : Immersion**
- Lire ce document
- Voir les écrans existants
- Identifier les patterns

**Jour 2 : Pratique**
- Créer une page test avec les composants
- Code review avec lead
- Ajustements

### 9.2 Onboarding Dev

**Jour 1 : Setup**
- Cloner le repo
- Installer les polices (Nunito, Inter)
- Comprendre tailwind.config.js

**Jour 2 : Composants**
- Créer un bouton CTA
- Créer une card glass
- Intégrer le motif Wax

**Jour 3 : Page complète**
- Reproduire l'écran d'accueil
- Code review
- Merge

### 9.3 Resources

**Figma** : [Lien vers Figma avec composants]
**Storybook** : [Lien vers composants isolés]
**GitHub** : [Lien vers le repo]

---

## 📊 10. Métriques de Qualité

### 10.1 Score "Âme du Marché"

- [ ] Background marché visible (3 pts)
- [ ] Motif Wax présent (2 pts)
- [ ] Glassmorphism cards (2 pts)
- [ ] CTA pilule terre (2 pts)
- [ ] Mascotte 3D (1 pt)

**Score minimum acceptable : 7/10**

### 10.2 Accessibilité

- [ ] Contraste WCAG AA minimum
- [ ] Touch targets >= 48px
- [ ] Texte >= 16px
- [ ] Focus visible
- [ ] Alt text sur images

### 10.3 Performance

- [ ] Image marché optimisée (< 200KB)
- [ ] Motif SVG inline (pas de requête HTTP)
- [ ] Animations GPU (transform, opacity)

---

## ✨ Conclusion

Ce Design System garantit :
1. **Cohérence** - Tous les écrans ont la même âme
2. **Qualité** - Standards élevés maintenus
3. **Efficacité** - Composants réutilisables
4. **Chaleur** - "Digital couleur de la terre"

**Version** : 1.0
**Date** : 03 Janvier 2026
**Équipe** : PNAVIM Tech

---

*"Chaque pixel doit respirer le marché ivoirien"*
