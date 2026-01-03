# ⚛️ Composants React PNAVIM

Bibliothèque de composants React prêts à l'emploi pour l'interface PNAVIM.

---

## 📦 Table des Matières

1. [Boutons](#boutons)
2. [Cards](#cards)
3. [Inputs](#inputs)
4. [Badges](#badges)
5. [Avatars & Mascottes](#avatars--mascottes)
6. [Layouts](#layouts)
7. [Animations](#animations)

---

## 🔘 Boutons

### ButtonCTA (Bouton Principal)

```tsx
// components/ui/ButtonCTA.tsx
import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonCTAProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'terre' | 'nature' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function ButtonCTA({
  variant = 'terre',
  size = 'md',
  className,
  children,
  ...props
}: ButtonCTAProps) {
  const variants = {
    terre: 'bg-gradient-terre hover:from-[#D35400] hover:to-[#A04000]',
    nature: 'bg-gradient-nature hover:from-[#1E8449] hover:to-[#1B5E20]',
    secondary: 'bg-white/90 backdrop-blur-md text-pnavim-terre border-2 border-pnavim-orange/50',
  };

  const sizes = {
    sm: 'px-6 py-3 text-base',
    md: 'px-8 py-4 text-lg',
    lg: 'px-10 py-5 text-xl',
    xl: 'px-12 py-6 text-2xl',
  };

  return (
    <button
      className={cn(
        'font-semibold rounded-pill',
        'shadow-terre hover:shadow-terre-lg',
        'transform hover:scale-105',
        'transition-all duration-300',
        'border-2 border-white/30',
        variant !== 'secondary' && 'text-white',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
```

**Usage** :
```tsx
<ButtonCTA variant="terre" size="lg" onClick={handleClick}>
  Je suis Marchand
</ButtonCTA>

<ButtonCTA variant="nature">
  Valider
</ButtonCTA>

<ButtonCTA variant="secondary">
  Annuler
</ButtonCTA>
```

### ButtonMicro (Bouton Vocal)

```tsx
// components/ui/ButtonMicro.tsx
import { Mic } from 'lucide-react';
import { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonMicroProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  isListening?: boolean;
  size?: 'md' | 'lg' | 'xl';
}

export function ButtonMicro({
  isListening = false,
  size = 'lg',
  className,
  ...props
}: ButtonMicroProps) {
  const sizes = {
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const iconSizes = {
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  return (
    <button
      className={cn(
        'bg-gradient-terre text-white',
        'rounded-full shadow-2xl',
        'flex items-center justify-center',
        'transform hover:scale-110',
        'transition-all duration-300',
        isListening ? 'animate-pulse-micro' : 'hover:animate-pulse-micro',
        sizes[size],
        className
      )}
      {...props}
    >
      <Mic className={iconSizes[size]} />
    </button>
  );
}
```

**Usage** :
```tsx
const [isListening, setIsListening] = useState(false);

<ButtonMicro
  isListening={isListening}
  size="xl"
  onClick={() => setIsListening(!isListening)}
/>
```

---

## 🎴 Cards

### GlassCard (Card Principal)

```tsx
// components/ui/GlassCard.tsx
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { AfricanPattern } from './african-pattern';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  pattern?: 'wax' | 'geometric' | 'kente' | 'none';
  patternOpacity?: number;
  children: React.ReactNode;
}

export function GlassCard({
  pattern = 'geometric',
  patternOpacity = 0.05,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-xl bg-white/90',
        'rounded-3xl p-8',
        'shadow-glass-lg',
        'border-2 border-white/30',
        'relative overflow-hidden',
        className
      )}
      {...props}
    >
      {pattern !== 'none' && (
        <div className="absolute inset-0 text-pnavim-terre pointer-events-none"
             style={{ opacity: patternOpacity }}>
          <AfricanPattern variant={pattern} />
        </div>
      )}

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
```

**Usage** :
```tsx
<GlassCard pattern="wax" patternOpacity={0.1}>
  <h3 className="text-h3 mb-4">Mon Solde</h3>
  <p className="text-body-xl font-bold text-pnavim-terre">125 000 F</p>
</GlassCard>
```

### CardTerre (Card Colorée)

```tsx
// components/ui/CardTerre.tsx
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { AfricanPattern } from './african-pattern';

interface CardTerreProps extends HTMLAttributes<HTMLDivElement> {
  pattern?: 'wax' | 'geometric' | 'kente';
  children: React.ReactNode;
}

export function CardTerre({
  pattern = 'wax',
  className,
  children,
  ...props
}: CardTerreProps) {
  return (
    <div
      className={cn(
        'backdrop-blur-xl bg-gradient-terre',
        'rounded-3xl p-8',
        'shadow-2xl',
        'border-2 border-pnavim-or/30',
        'relative overflow-hidden',
        'text-white',
        className
      )}
      {...props}
    >
      {/* Motif en blanc */}
      <div className="absolute inset-0 text-white opacity-10 pointer-events-none">
        <AfricanPattern variant={pattern} />
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
```

**Usage** :
```tsx
<CardTerre pattern="geometric">
  <h2 className="text-h2 mb-2">Bienvenue</h2>
  <p className="text-body-xl">Je suis Marchand</p>
</CardTerre>
```

---

## 📝 Inputs

### InputPNAVIM

```tsx
// components/ui/InputPNAVIM.tsx
import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface InputPNAVIMProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: LucideIcon;
  error?: string;
}

export const InputPNAVIM = forwardRef<HTMLInputElement, InputPNAVIMProps>(
  ({ icon: Icon, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          {Icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-pnavim-terre">
              <Icon className="w-6 h-6" />
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              'w-full bg-white/90 backdrop-blur-md',
              'border-2 border-pnavim-orange/30',
              'rounded-2xl px-6 py-4',
              Icon && 'pl-14',
              'text-lg text-pnavim-charbon',
              'placeholder:text-pnavim-charbon-light',
              'focus:border-pnavim-terre focus:ring-4 focus:ring-pnavim-orange/20',
              'focus:outline-none',
              'transition-all duration-300',
              'shadow-lg',
              error && 'border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="mt-2 text-sm text-red-600 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

InputPNAVIM.displayName = 'InputPNAVIM';
```

**Usage** :
```tsx
import { User, Phone } from 'lucide-react';

<InputPNAVIM
  icon={User}
  placeholder="Votre nom"
  type="text"
/>

<InputPNAVIM
  icon={Phone}
  placeholder="Numéro de téléphone"
  type="tel"
  error="Numéro invalide"
/>
```

---

## 🏷️ Badges

### Badge Component

```tsx
// components/ui/Badge.tsx
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'important' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
}

export function Badge({ variant = 'important', className, children, ...props }: BadgeProps) {
  const variants = {
    important: 'bg-gradient-moutarde text-yellow-900 border-yellow-500/50',
    success: 'bg-pnavim-manioc text-white border-transparent',
    warning: 'bg-orange-500 text-white border-transparent',
    info: 'bg-blue-500 text-white border-transparent',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2',
        'px-4 py-2 rounded-pill',
        'text-sm font-bold',
        'shadow-lg border-2',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
```

**Usage** :
```tsx
<Badge variant="important">
  ⭐ Accès principal
</Badge>

<Badge variant="success">
  ✓ Validé
</Badge>

<Badge variant="warning">
  ⚠ Attention
</Badge>
```

---

## 👤 Avatars & Mascottes

### Avatar3D Component

```tsx
// components/ui/Avatar3D.tsx
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface Avatar3DProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withGlow?: boolean;
}

export function Avatar3D({
  src,
  alt,
  size = 'lg',
  withGlow = true,
  className,
  ...props
}: Avatar3DProps) {
  const sizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48',
  };

  return (
    <div
      className={cn(
        'relative rounded-full overflow-hidden',
        withGlow && 'shadow-2xl',
        sizes[size],
        className
      )}
      {...props}
    >
      {withGlow && (
        <div className="absolute inset-0 bg-gradient-terre opacity-20 blur-xl" />
      )}

      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover relative z-10"
      />
    </div>
  );
}
```

**Usage** :
```tsx
<Avatar3D
  src="/suta-avatar-3d.png"
  alt="Tantie Sagesse"
  size="xl"
  withGlow
/>
```

### MascotteCard (Card avec Mascotte)

```tsx
// components/ui/MascotteCard.tsx
import { GlassCard } from './GlassCard';
import { Avatar3D } from './Avatar3D';

interface MascotteCardProps {
  mascotte: {
    name: string;
    avatar: string;
  };
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}

export function MascotteCard({
  mascotte,
  title,
  subtitle,
  children,
}: MascotteCardProps) {
  return (
    <GlassCard pattern="wax" className="text-center">
      {/* Avatar avec label */}
      <div className="flex flex-col items-center mb-6">
        <Avatar3D
          src={mascotte.avatar}
          alt={mascotte.name}
          size="xl"
        />
        <p className="mt-3 text-sm font-semibold text-pnavim-charbon-light">
          {mascotte.name}
        </p>
      </div>

      {/* Titre */}
      <h2 className="text-h2 font-display mb-2">
        {title}
      </h2>

      {subtitle && (
        <p className="text-body-xl text-pnavim-or font-bold mb-6">
          {subtitle}
        </p>
      )}

      {/* Contenu additionnel */}
      {children}
    </GlassCard>
  );
}
```

**Usage** :
```tsx
<MascotteCard
  mascotte={{
    name: "Tantie Sagesse",
    avatar: "/suta-avatar-3d.png"
  }}
  title="Bienvenue"
  subtitle="Je suis Marchand"
>
  <ButtonCTA variant="terre" className="w-full">
    Commencer
  </ButtonCTA>
</MascotteCard>
```

---

## 📐 Layouts

### PageLayout (Layout de Page)

```tsx
// components/layouts/PageLayout.tsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  backgroundImage?: string;
  overlayGradient?: boolean;
  children: ReactNode;
  className?: string;
}

export function PageLayout({
  backgroundImage,
  overlayGradient = true,
  children,
  className,
}: PageLayoutProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background image */}
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-cover bg-center filter-warm"
          style={{ backgroundImage: `url(${backgroundImage})` }}
        />
      )}

      {/* Overlay gradient */}
      {overlayGradient && (
        <div className="absolute inset-0 bg-gradient-overlay" />
      )}

      {/* Content */}
      <div className={cn('relative z-10 min-h-screen', className)}>
        {children}
      </div>
    </div>
  );
}
```

**Usage** :
```tsx
<PageLayout
  backgroundImage="/marche-ivoirien.jpg"
  overlayGradient
  className="flex flex-col"
>
  <header>...</header>
  <main className="flex-1">...</main>
  <footer>...</footer>
</PageLayout>
```

### SectionContainer

```tsx
// components/layouts/SectionContainer.tsx
import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface SectionContainerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function SectionContainer({
  children,
  size = 'md',
  className,
  ...props
}: SectionContainerProps) {
  const sizes = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
  };

  return (
    <section
      className={cn(
        'container mx-auto px-4',
        'py-12 md:py-16',
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}
```

**Usage** :
```tsx
<SectionContainer size="lg">
  <h2 className="text-h2 mb-8">Mes Ventes</h2>
  {/* Contenu */}
</SectionContainer>
```

---

## 🎬 Animations

### FadeIn Component

```tsx
// components/animations/FadeIn.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({
  children,
  delay = 0,
  duration = 0.3,
  className,
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

### SlideUp Component

```tsx
// components/animations/SlideUp.tsx
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SlideUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function SlideUp({ children, delay = 0, className }: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

**Usage** :
```tsx
<FadeIn delay={0.2}>
  <GlassCard>Contenu animé</GlassCard>
</FadeIn>

<SlideUp delay={0.4}>
  <ButtonCTA>Apparition en slide</ButtonCTA>
</SlideUp>
```

---

## 🎨 Exemple Complet : Page d'Accueil

```tsx
// pages/Home.tsx
import { PageLayout } from '@/components/layouts/PageLayout';
import { SectionContainer } from '@/components/layouts/SectionContainer';
import { MascotteCard } from '@/components/ui/MascotteCard';
import { ButtonCTA } from '@/components/ui/ButtonCTA';
import { ButtonMicro } from '@/components/ui/ButtonMicro';
import { FadeIn } from '@/components/animations/FadeIn';
import { Volume2 } from 'lucide-react';

export default function Home() {
  const [isListening, setIsListening] = useState(false);

  return (
    <PageLayout
      backgroundImage="/marche-ivoirien.jpg"
      overlayGradient
      className="flex flex-col"
    >
      {/* Header */}
      <header className="py-6">
        <div className="container text-center">
          <h1 className="text-h2 text-white font-display">
            PNAVIM
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <SectionContainer
        size="md"
        className="flex-1 flex items-center justify-center"
      >
        <FadeIn delay={0.2}>
          <MascotteCard
            mascotte={{
              name: "Tantie Sagesse",
              avatar: "/suta-avatar-3d.png"
            }}
            title="Bienvenue"
            subtitle="Je suis Marchand"
          >
            {/* Bouton vocal */}
            <div className="flex flex-col items-center gap-6 mt-8">
              <ButtonMicro
                isListening={isListening}
                size="xl"
                onClick={() => setIsListening(!isListening)}
              />

              <div className="flex items-center gap-2 text-pnavim-charbon-light">
                <Volume2 className="w-6 h-6" />
                <span className="text-lg">Cliquez pour écouter</span>
              </div>

              {/* CTA */}
              <ButtonCTA variant="nature" className="w-full mt-4">
                Se connecter
              </ButtonCTA>
            </div>
          </MascotteCard>
        </FadeIn>
      </SectionContainer>

      {/* Footer */}
      <footer className="py-8 text-center">
        <div className="inline-block glass-strong rounded-2xl px-10 py-6">
          <p className="text-xl text-pnavim-charbon font-bold">
            République de Côte d'Ivoire
          </p>
          <p className="text-lg text-pnavim-charbon-light mt-1">
            DGE • ANSUT
          </p>
        </div>
      </footer>
    </PageLayout>
  );
}
```

---

## 📚 Ressources

### Utilitaires Helper

```tsx
// lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Installation des Dépendances

```bash
npm install clsx tailwind-merge
npm install framer-motion  # Pour les animations
npm install lucide-react   # Pour les icônes
```

---

**✨ Bibliothèque de composants PNAVIM - Prête à l'emploi!**
