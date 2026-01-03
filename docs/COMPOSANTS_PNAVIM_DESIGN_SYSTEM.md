# 🧩 Bibliothèque de Composants PNAVIM

**Design System - Composants Réutilisables**

*"Copy-paste ready components"*

---

## 📚 Table des Matières

1. [Boutons](#boutons)
2. [Cards](#cards)
3. [Backgrounds](#backgrounds)
4. [Badges & Labels](#badges--labels)
5. [Inputs & Forms](#inputs--forms)
6. [Navigation](#navigation)
7. [Animations](#animations)

---

## 1. Boutons

### 1.1 Bouton CTA Pilule (Principal)

```tsx
<button className="
  rounded-full
  bg-gradient-to-r from-[#E67E22] to-[#C25E00]
  hover:from-[#D35400] hover:to-[#A04000]
  shadow-[0_4px_14px_rgba(194,94,0,0.39)]
  hover:shadow-[0_8px_24px_rgba(194,94,0,0.5)]
  text-white font-heading font-bold
  text-lg md:text-xl
  h-14 md:h-16
  px-8 md:px-12
  transform hover:scale-105 active:scale-95
  transition-all duration-300
  border-2 border-white/30
">
  Commencer
</button>
```

**Usage** : CTA principaux, actions importantes

**Variantes** :

```tsx
// Succès (Vert Manioc)
className="bg-gradient-to-r from-[#4CAF50] to-[#2E7D32] hover:from-[#2E7D32] hover:to-[#1B5E20]"

// Alerte (Moutarde)
className="bg-gradient-to-r from-[#F39C12] to-[#F1C40F] text-[#2D3436]"

// Secondaire (Outline)
className="bg-transparent border-2 border-[#C25E00] text-[#C25E00] hover:bg-[#C25E00] hover:text-white"
```

### 1.2 Bouton Vocal avec Animation

```tsx
import { Mic } from 'lucide-react';

function VoiceButton({ isListening, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`
        relative rounded-full
        bg-gradient-to-r from-[#E67E22] to-[#C25E00]
        shadow-[0_4px_14px_rgba(194,94,0,0.39)]
        text-white font-heading font-bold
        h-16 w-16 md:h-20 md:w-20
        flex items-center justify-center
        transform hover:scale-105 active:scale-95
        transition-all duration-300
        border-2 border-white/30
        ${isListening ? 'animate-pulse' : ''}
      `}
    >
      {isListening && (
        <span className="absolute inset-0 rounded-full bg-[#C25E00]/50 animate-ping" />
      )}
      <Mic className="relative z-10 w-8 h-8" />
    </button>
  );
}
```

**Usage** : Commandes vocales, enregistrement audio

### 1.3 Bouton Ghost (Secondaire)

```tsx
<button className="
  rounded-2xl
  bg-white/20 backdrop-blur-sm
  hover:bg-white/30
  border-2 border-white/40
  text-white font-semibold
  h-12 px-6
  transition-all duration-300
">
  Annuler
</button>
```

---

## 2. Cards

### 2.1 Card Glassmorphism Standard

```tsx
<div className="
  backdrop-blur-2xl
  bg-white/85
  border-2 border-white/25
  rounded-3xl
  p-6 md:p-8
  shadow-[0_8px_32px_rgba(0,0,0,0.12)]
  hover:shadow-[0_16px_48px_rgba(0,0,0,0.18)]
  transition-shadow duration-300
  relative overflow-hidden
">
  {/* Motif Wax optionnel */}
  <div className="absolute inset-0 text-[#C25E00] opacity-[0.05] pointer-events-none">
    <AfricanPattern variant="geometric" opacity={0.3} />
  </div>

  {/* Contenu */}
  <div className="relative z-10">
    <h3 className="text-2xl font-heading font-bold text-[#2D3436] mb-2">
      Titre
    </h3>
    <p className="text-base text-[#636E72]">
      Contenu de la carte
    </p>
  </div>
</div>
```

**Usage** : Conteneurs de contenu, sections importantes

### 2.2 Card Action (Cliquable)

```tsx
<button className="
  w-full
  backdrop-blur-2xl
  bg-gradient-to-br from-[#C25E00]/85 to-[#E67E22]/85
  hover:from-[#A04000]/95 hover:to-[#D35400]/95
  text-white
  rounded-[2rem]
  shadow-[0_8px_32px_rgba(0,0,0,0.3)]
  hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]
  transform hover:scale-[1.02]
  transition-all duration-300
  p-8 md:p-12
  min-h-[250px]
  flex flex-col items-center justify-center gap-6
  border-2 border-white/20
  relative overflow-hidden
  group
">
  {/* Motif */}
  <div className="absolute inset-0 text-white opacity-[0.08] pointer-events-none">
    <AfricanPattern variant="wax" opacity={0.5} />
  </div>

  {/* Icône */}
  <div className="relative z-10">
    <div className="bg-white/20 p-6 rounded-full group-hover:bg-white/30 transition-colors border-4 border-white/30">
      <ShoppingCart className="w-20 h-20" strokeWidth={2.5} />
    </div>
  </div>

  {/* Texte */}
  <div className="relative z-10">
    <h2 className="text-4xl font-heading font-black mb-2">VENDRE</h2>
    <p className="text-xl font-semibold text-white/90">Encaisser vente</p>
  </div>
</button>
```

**Usage** : Actions principales dashboard

### 2.3 Card Produit (Caisse)

```tsx
<div className="
  backdrop-blur-xl
  bg-white/90
  rounded-3xl
  shadow-[0_8px_32px_rgba(0,0,0,0.3)]
  p-6
  border-2 border-white/30
  relative overflow-hidden
  transform hover:scale-[1.02]
  transition-all duration-300
">
  {/* Motif subtil */}
  <div className="absolute inset-0 text-[#C25E00] opacity-[0.03] pointer-events-none">
    <AfricanPattern variant="geometric" opacity={0.3} />
  </div>

  <div className="relative z-10">
    {/* Image produit */}
    <div className="text-6xl text-center mb-3">🍚</div>

    {/* Infos */}
    <h3 className="text-2xl font-bold text-[#2D3436] text-center">Riz</h3>
    <p className="text-xl text-[#C25E00] font-bold text-center mt-2">500 F</p>
    <p className="text-base text-[#636E72] text-center">/Kg</p>

    {/* Contrôles quantité */}
    <div className="flex items-center justify-between gap-2 mt-4">
      <button className="
        bg-gradient-to-r from-red-500 to-red-600
        hover:from-red-600 hover:to-red-700
        disabled:from-gray-300 disabled:to-gray-400
        text-white p-3 rounded-full
        shadow-lg hover:shadow-xl
        transform hover:scale-110 disabled:transform-none
        transition-all
      ">
        <Minus className="w-6 h-6" />
      </button>

      <span className="text-3xl font-bold text-[#2D3436]">0</span>

      <button className="
        bg-gradient-to-r from-[#2E7D32] to-[#4CAF50]
        hover:from-[#1B5E20] hover:to-[#2E7D32]
        text-white p-3 rounded-full
        shadow-lg hover:shadow-xl
        transform hover:scale-110
        transition-all
      ">
        <Plus className="w-6 h-6" />
      </button>
    </div>
  </div>
</div>
```

**Usage** : Liste de produits en caisse

---

## 3. Backgrounds

### 3.1 Background Marché Immersif

```tsx
<div className="min-h-screen relative overflow-hidden">
  {/* Image marché vibrante */}
  <div
    className="absolute inset-0 bg-cover bg-center"
    style={{
      backgroundImage: 'url(/marche-ivoirien.jpg)',
      filter: 'brightness(0.85) saturate(1.3) contrast(1.05)',
    }}
  />

  {/* Overlay dégradé terre */}
  <div className="absolute inset-0 bg-gradient-to-br from-[#D35400]/35 via-[#E67E22]/25 to-[#27AE60]/30" />

  {/* Contenu */}
  <div className="relative z-10 min-h-screen">
    {/* Votre contenu ici */}
  </div>
</div>
```

**Usage** : Pages d'accueil, dashboard, caisse

### 3.2 Composant Background Réutilisable

```tsx
export function MarketBackground({ children }) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(/marche-ivoirien.jpg)',
          filter: 'brightness(0.85) saturate(1.3) contrast(1.05)',
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-[#D35400]/35 via-[#E67E22]/25 to-[#27AE60]/30" />
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}

// Usage
<MarketBackground>
  <YourPageContent />
</MarketBackground>
```

---

## 4. Badges & Labels

### 4.1 Badge Validé

```tsx
<span className="
  inline-flex items-center gap-2
  rounded-full
  bg-[#2E7D32]/15 text-[#2E7D32]
  px-4 py-2
  text-sm font-bold
  border-2 border-[#2E7D32]/30
">
  ✅ Validé
</span>
```

### 4.2 Badge Important

```tsx
<span className="
  inline-flex items-center gap-2
  rounded-full
  bg-gradient-to-r from-[#F1C40F] to-[#F39C12]
  text-[#2D3436]
  px-4 py-2
  text-sm font-bold
  shadow-lg
  border-2 border-yellow-600/30
">
  ⭐ Important
</span>
```

### 4.3 Label "Tantie Sagesse"

```tsx
<div className="absolute -top-2 -right-2 z-20">
  <div className="
    bg-white/90 backdrop-blur-sm
    px-3 py-1
    rounded-full
    shadow-lg
    border-2 border-white/50
  ">
    <p className="text-[#C25E00] text-sm font-bold leading-tight">
      Tantie<br />Sagesse
    </p>
  </div>
</div>
```

### 4.4 Badge Status

```tsx
// En ligne
<span className="
  inline-flex items-center gap-2
  rounded-full
  bg-[#4CAF50]/15 text-[#2E7D32]
  px-3 py-1
  text-xs font-semibold
">
  <span className="w-2 h-2 rounded-full bg-[#4CAF50] animate-pulse" />
  En ligne
</span>

// Hors ligne
<span className="
  inline-flex items-center gap-2
  rounded-full
  bg-gray-200 text-gray-600
  px-3 py-1
  text-xs font-semibold
">
  <span className="w-2 h-2 rounded-full bg-gray-400" />
  Hors ligne
</span>
```

---

## 5. Inputs & Forms

### 5.1 Input Glassmorphism

```tsx
<input
  type="text"
  placeholder="Entrez votre nom"
  className="
    w-full
    backdrop-blur-xl bg-white/90
    border-2 border-white/40
    focus:border-[#C25E00]
    focus:ring-4 focus:ring-[#C25E00]/20
    rounded-2xl
    px-6 py-4
    text-lg text-[#2D3436]
    placeholder:text-[#636E72]
    transition-all duration-300
  "
/>
```

### 5.2 Textarea Glassmorphism

```tsx
<textarea
  placeholder="Votre message"
  rows={4}
  className="
    w-full
    backdrop-blur-xl bg-white/90
    border-2 border-white/40
    focus:border-[#C25E00]
    focus:ring-4 focus:ring-[#C25E00]/20
    rounded-2xl
    px-6 py-4
    text-lg text-[#2D3436]
    placeholder:text-[#636E72]
    resize-none
    transition-all duration-300
  "
/>
```

### 5.3 Select Glassmorphism

```tsx
<select className="
  w-full
  backdrop-blur-xl bg-white/90
  border-2 border-white/40
  focus:border-[#C25E00]
  focus:ring-4 focus:ring-[#C25E00]/20
  rounded-2xl
  px-6 py-4
  text-lg text-[#2D3436]
  cursor-pointer
  transition-all duration-300
">
  <option>Sélectionnez</option>
  <option>Option 1</option>
  <option>Option 2</option>
</select>
```

---

## 6. Navigation

### 6.1 Header avec Bouton Jaune

```tsx
<header className="sticky top-0 z-50 backdrop-blur-sm bg-white/95 shadow-md">
  <div className="container mx-auto px-4 py-3">
    <div className="flex items-center justify-between">
      {/* Logo */}
      <h1 className="text-2xl font-heading font-bold bg-gradient-to-r from-[#C25E00] to-[#E67E22] bg-clip-text text-transparent">
        PNAVIM-CI
      </h1>

      {/* Actions */}
      <button className="
        bg-gradient-to-r from-[#F1C40F] to-[#F39C12]
        hover:from-[#F39C12] hover:to-[#E67E22]
        text-[#2D3436]
        font-bold
        rounded-full
        px-6 py-2
        shadow-lg hover:shadow-xl
        transform hover:scale-105
        transition-all
        border-2 border-yellow-600/30
      ">
        Se connecter
      </button>
    </div>
  </div>
</header>
```

### 6.2 Bouton Retour

```tsx
<button className="
  fixed top-24 left-4 z-50
  backdrop-blur-xl bg-white/90 hover:bg-white
  text-[#C25E00]
  p-4 rounded-full
  shadow-xl hover:shadow-2xl
  border-2 border-white/30
  transform hover:scale-105
  transition-all
">
  <ArrowLeft className="w-8 h-8" />
</button>
```

---

## 7. Animations

### 7.1 Pulse Doux

```tsx
<div className="animate-pulse">
  {/* Contenu */}
</div>
```

### 7.2 Ping (Notification)

```tsx
<div className="relative">
  <span className="absolute inset-0 rounded-full bg-[#C25E00]/50 animate-ping" />
  <div className="relative z-10">
    {/* Contenu */}
  </div>
</div>
```

### 7.3 Fade In

```tsx
<div className="animate-fade-in">
  {/* Contenu qui apparaît */}
</div>

/* CSS requis (déjà dans index.css) */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}
```

### 7.4 Slide Up

```tsx
<div className="animate-slide-up">
  {/* Contenu qui glisse vers le haut */}
</div>

/* CSS requis (déjà dans index.css) */
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}
```

---

## 🎯 Exemples Complets

### Page Type "Dashboard"

```tsx
import { MarketBackground } from '@/components/backgrounds';
import { ShoppingCart, Package, History } from 'lucide-react';

export default function Dashboard() {
  return (
    <MarketBackground>
      <Header />

      <main className="container py-12">
        {/* Hero avec Tantie */}
        <div className="text-center mb-12">
          <img
            src="/suta-avatar-3d.png"
            alt="Tantie Sagesse"
            className="w-32 h-32 mx-auto mb-6 drop-shadow-2xl"
          />

          <div className="
            backdrop-blur-2xl bg-white/85
            border-2 border-white/25
            rounded-3xl px-8 py-6
            inline-block shadow-glass
            relative overflow-hidden
          ">
            <div className="absolute inset-0 text-[#C25E00] opacity-[0.05]">
              <WaxPattern />
            </div>
            <div className="relative z-10">
              <h1 className="text-5xl font-heading font-bold text-[#2D3436] mb-2">
                Bonjour Patrick ! 👋
              </h1>
              <p className="text-2xl text-[#636E72]">
                Que veux-tu faire aujourd'hui ?
              </p>
            </div>
          </div>
        </div>

        {/* Grid Actions */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <ActionCard
            icon={ShoppingCart}
            title="VENDRE"
            subtitle="Encaisser vente"
            gradient="from-[#C25E00]/90 to-[#E67E22]/90"
            onClick={() => navigate('/vendre')}
          />
          <ActionCard
            icon={History}
            title="HISTORIQUE"
            subtitle="Voir mes ventes"
            gradient="from-[#D35400]/85 to-[#A04000]/85"
            onClick={() => navigate('/historique')}
          />
        </div>
      </main>
    </MarketBackground>
  );
}
```

---

## 📦 Composants Helpers

### WaxPattern Component

```tsx
export function WaxPattern({ opacity = 0.06, className = '' }) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ opacity }}
    >
      <svg
        className="w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="wax" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="8" fill="currentColor" opacity="0.3" />
            <circle cx="60" cy="40" r="12" fill="currentColor" opacity="0.2" />
            <circle cx="100" cy="20" r="6" fill="currentColor" opacity="0.3" />
            <path d="M 10 60 Q 30 50 50 60 T 90 60" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#wax)" />
      </svg>
    </div>
  );
}
```

---

## ✅ Checklist Composant

Avant d'utiliser un composant, vérifier :

- [ ] Glassmorphism appliqué (`backdrop-blur-xl`)
- [ ] Motif Wax sur éléments importants
- [ ] Couleurs PNAVIM utilisées
- [ ] Ombres fortes sur CTA
- [ ] Animations douces (300ms)
- [ ] Touch targets >= 48px
- [ ] Texte >= 16px
- [ ] Contrastes WCAG AA

---

*Mis à jour : 03 Janvier 2026*
