# 🤖 Prompts Lovable - PNAVIM Design System

**Génération automatique d'écrans conformes**

*"Copy-paste ces prompts dans Lovable pour générer des écrans cohérents"*

---

## 📋 Table des Matières

1. [Prompt Template Universel](#prompt-template-universel)
2. [Page d'Accueil](#page-daccueil)
3. [Dashboard Marchand](#dashboard-marchand)
4. [Caisse (Cash Register)](#caisse-cash-register)
5. [Historique Ventes](#historique-ventes)
6. [Page de Connexion](#page-de-connexion)
7. [Profil Marchand](#profil-marchand)

---

## 🎯 Prompt Template Universel

**À utiliser comme base pour tous les écrans** :

```
Génère une page [NOM_PAGE] pour PNAVIM-CI (React + Tailwind + shadcn/ui)
conforme au Design System "L'Âme du Marché".

=== STYLE GLOBAL ===
Palette de couleurs :
- Terre Battue : #C25E00 (CTA principaux)
- Orange Sanguine : #E67E22 (dégradés)
- Vert Manioc : #2E7D32 (succès)
- Jaune Moutarde : #F1C40F (alertes)
- Sable : #FFF5E6 (fond)
- Charbon : #2D3436 (texte)

Typographie :
- Titres : Nunito (800)
- Texte : Inter (>=16px)

Look & feel :
- Chaleur + modernité glassmorphism
- Motif Wax Digital en filigrane (opacity 6-8%)
- Jamais de fond blanc plat

=== FOND DE PAGE ===
- Background : photo marché floutée (placeholder)
- Filter : brightness(0.85) saturate(1.3) contrast(1.05)
- Overlay : dégradé orange/terre (rgba chaud)

=== COMPOSANTS ===
Boutons CTA :
- rounded-full
- bg-gradient-to-r from-[#E67E22] to-[#C25E00]
- shadow-[0_4px_14px_rgba(194,94,0,0.39)]
- hover:scale-105

Cards glassmorphism :
- backdrop-blur-2xl
- bg-white/85
- border-2 border-white/25
- rounded-3xl

Texte minimum : 16px partout

=== [SECTION SPÉCIFIQUE À LA PAGE] ===
[Décrire la structure et les comportements spécifiques]

=== ACCESSIBILITÉ & MOBILE ===
- Mobile-first
- Touch targets >= 48px
- Contrastes WCAG AA

=== RÉSULTAT ===
Page chaleureuse, moderne, "digital couleur de la terre"
```

---

## 1. Page d'Accueil

```
Génère une page d'accueil PNAVIM-CI (React + Tailwind + shadcn/ui)
conforme au Design System "L'Âme du Marché".

=== STYLE GLOBAL ===
Palette :
- Terre Battue : #C25E00
- Orange Sanguine : #E67E22
- Vert Manioc : #2E7D32
- Sable : #FFF5E6
- Charbon : #2D3436

Typo :
- Nunito (titres 800)
- Inter (body >=16px)

Look : chaleur + glassmorphism + motif Wax (opacity 6-8%)

=== FOND ===
- Photo marché floutée
- Filter : brightness(0.85) saturate(1.3) contrast(1.05)
- Overlay dégradé orange

=== LAYOUT ===
Header :
- Logo PNAVIM-CI (gauche, gradient terre)
- Navigation : Accueil, Acteurs, Marché, Support
- Sélecteur langue (FR/Dioula)
- Bouton "Se connecter" (gradient jaune moutarde)

Hero central :
- Grande card glassmorphism (bg-white/85 backdrop-blur-2xl)
- Layout : 2 colonnes (desktop) / empilé (mobile)

Colonne gauche :
- H1 : "Je suis Marchand"
- Sous-texte : "Encaisser, vendre et épargner"
- Personnage 3D "Tantie Sagesse" en bas à droite
  (déborde légèrement pour effet profondeur)
- Badge "⭐ Accès principal" (gradient moutarde)
- CTA pilule : "🎙️ Cliquez pour écouter"
  - rounded-full
  - bg-gradient-to-r from-[#E67E22] to-[#C25E00]
  - shadow-[0_4px_14px_rgba(194,94,0,0.39)]
  - avec motif Wax (opacity 8%)

Colonne droite :
- 2 cards glassmorphism plus petites
- Card 1 : "Agent terrain"
  - Pictogramme agent
  - Texte descriptif
  - Bouton play vocal
  - Background gradient vert manioc
- Card 2 : "Coopérative"
  - Pictogramme coopérative
  - Texte descriptif
  - Background gradient terre

Footer :
- "République de Côte d'Ivoire"
- "DGE • ANSUT"
- Card glassmorphism blanche

=== COMPORTEMENTS ===
- CTA vocal : animation pulse au hover
- Cards : hover scale-105
- Tantie : hover scale-105 + rotation subtile

=== MOBILE ===
- Cards de droite passent sous le hero
- Stack vertical
- Boutons >= 48px

=== RÉSULTAT ===
Page d'accueil chaleureuse avec héros vocal, mascottes 3D,
et ambiance marché ivoirien immersive.
```

---

## 2. Dashboard Marchand

```
Génère un dashboard marchand PNAVIM-CI (React + Tailwind + shadcn/ui)
conforme au Design System "L'Âme du Marché".

=== STYLE GLOBAL ===
Palette :
- Terre : #C25E00
- Sanguine : #E67E22
- Manioc : #2E7D32
- Moutarde : #F1C40F
Typo : Nunito (titres), Inter (body >=16px)
Look : glassmorphism + motifs Wax

=== FOND ===
- Photo marché floutée + overlay orange/terre

=== LAYOUT ===
Header sticky :
- Logo PNAVIM-CI
- Nom marchand
- Bouton user (gradient terre)

Hero :
- Avatar "Tantie Sagesse" 3D (128x128px) avec glow jaune
- Card glassmorphism blanche
- Message : "Bonjour Patrick ! 👋"
- Sous-texte : "Que veux-tu faire aujourd'hui ?"
- Motif Wax subtil (opacity 5%)

Grid Actions (2 colonnes desktop) :
5 boutons d'action glassmorphism :

1. VENDRE
   - Gradient : from-[#C25E00]/90 to-[#E67E22]/90
   - Icône : ShoppingCart (w-24 h-24)
   - Motif : Wax
   - min-h-[300px]

2. HISTORIQUE
   - Gradient : from-[#D35400]/85 to-[#A04000]/85
   - Icône : History
   - Motif : geometric

3. STOCK
   - Gradient : from-[#2E7D32]/90 to-[#4CAF50]/90
   - Icône : Package
   - Motif : Wax

4. WALLET
   - Gradient : from-[#E67E22]/85 to-[#F1C40F]/85
   - Icône : Send
   - Motif : geometric

5. ÉPARGNE
   - Gradient : from-[#F1C40F]/90 to-[#E67E22]/90
   - Icône : Wallet
   - Motif : kente

Tous les boutons :
- rounded-[2rem]
- backdrop-blur-2xl
- shadow-[0_8px_32px_rgba(0,0,0,0.3)]
- hover:scale-105
- border-2 border-white/20
- Flèche en bas à droite

Message d'aide (bas) :
- Card glassmorphism verte
- "❓ Besoin d'aide ?"
- "Appelle ton agent terrain"

=== COMPORTEMENTS ===
- Hover sur cards : scale-105 + shadow plus forte
- Animations douces 300ms

=== MOBILE ===
- Grid 1 colonne
- Cards empilées

=== RÉSULTAT ===
Dashboard chaleureux avec Tantie qui guide,
5 actions principales en glassmorphism terre/vert.
```

---

## 3. Caisse (Cash Register)

```
Génère une page caisse PNAVIM-CI (React + Tailwind + shadcn/ui)
conforme au Design System "L'Âme du Marché".

=== STYLE GLOBAL ===
Palette : Terre #C25E00, Sanguine #E67E22, Manioc #2E7D32
Typo : Nunito (titres), Inter (body >=16px)
Look : glassmorphism + motifs Wax

=== FOND ===
- Photo marché floutée + overlay orange

=== LAYOUT ===
Header :
- Logo + titre "VENDRE"
- Card glassmorphism orange/terre avec motif Wax
- Icône ShoppingCart

Grid Produits (4 colonnes desktop, 2 colonnes mobile) :
Cards produits glassmorphism (bg-white/90) :
- Emoji produit (text-6xl)
- Nom (text-2xl, font-bold)
- Prix (text-xl, color terre, font-bold)
- Unité (text-base, gris)
- Contrôles quantité :
  * Bouton - (gradient rouge, rounded-full, shadow-lg)
  * Nombre (text-3xl, font-bold)
  * Bouton + (gradient vert manioc, rounded-full, shadow-lg)
- Motif géométrique subtil (opacity 3%)
- hover:scale-[1.02]

Produits à inclure :
- Riz (🍚, 500F/Kg)
- Tomate (🍅, 200F/Kg)
- Oignon (🧅, 300F/Kg)
- Poisson (🐟, 1500F/Kg)
- Poulet (🍗, 2000F/Pièce)
- Banane (🍌, 150F/Régime)
- Igname (🥔, 400F/Kg)
- Huile (🛢️, 800F/Litre)

Barre Total (fixed bottom) :
- backdrop-blur-2xl
- bg-gradient-to-r from-[#D35400]/95 via-[#E67E22]/95 to-[#F39C12]/95
- border-t-4 border-[#F1C40F]/50
- shadow-[0_-8px_32px_rgba(0,0,0,0.4)]
- Motif Wax (opacity 8%)

Contenu barre :
- Texte "Total à encaisser" (text-xl, white/90)
- Montant (text-5xl, font-black, white)
- Bouton VALIDER (géant) :
  * rounded-full
  * bg-gradient-to-r from-[#2E7D32] to-[#4CAF50]
  * shadow-2xl
  * Icône Check (w-12 h-12)
  * "VALIDER" (text-3xl, font-bold)
  * border-2 border-white/30

=== COMPORTEMENTS ===
- Clic + : augmente quantité
- Clic - : diminue quantité
- Hover boutons : scale-110
- VALIDER disabled si total = 0

=== MOBILE ===
- Grid 2 colonnes
- Barre total responsive

=== RÉSULTAT ===
Caisse vibrante avec produits glassmorphism,
contrôles tactiles géants, et barre de total immersive.
```

---

## 4. Historique Ventes

```
Génère une page historique des ventes PNAVIM-CI
(React + Tailwind + shadcn/ui) conforme au Design System.

=== STYLE GLOBAL ===
Palette : Terre #C25E00, Manioc #2E7D32, Moutarde #F1C40F
Typo : Nunito (titres), Inter (body)
Look : glassmorphism + motifs

=== FOND ===
- Photo marché + overlay terre

=== LAYOUT ===
Header :
- Titre "HISTORIQUE DES VENTES"
- Card glassmorphism gradient terre
- Icône History

Filtres (cards glassmorphism blanches) :
- Sélecteur période (Aujourd'hui, Semaine, Mois)
- Sélecteur produit (Tous, Riz, Tomate...)
- Stats rapides :
  * Total ventes (gradient terre)
  * Nombre transactions (gradient manioc)
  * Meilleur produit (gradient moutarde)

Liste Ventes :
Cards glassmorphism blanches (empilées) :
- Date/heure (text-sm, gris)
- Produit + quantité (text-xl, font-bold)
- Montant (text-2xl, color terre, font-bold)
- Badge statut ("✅ Payé" vert / "⏳ En attente" moutarde)
- Motif subtil
- hover:shadow-forte

Pagination (bas) :
- Boutons pilules glassmorphism
- Numéros de page
- Flèches navigation

=== COMPORTEMENTS ===
- Filtres : mise à jour instantanée
- Click card : détails vente (modal)
- Scroll infini si nombreuses ventes

=== MOBILE ===
- Filtres en accordéon
- Cards full-width

=== RÉSULTAT ===
Historique clair avec filtres glassmorphism,
stats visuelles, et liste de transactions immersive.
```

---

## 5. Page de Connexion

```
Génère une page de connexion PNAVIM-CI
(React + Tailwind + shadcn/ui) conforme au Design System.

=== STYLE GLOBAL ===
Palette : Terre #C25E00, Moutarde #F1C40F, Sable #FFF5E6
Typo : Nunito (titres), Inter (body)
Look : glassmorphism + motifs Wax

=== FOND ===
- Photo marché floutée + overlay orange doux

=== LAYOUT ===
Centré vertical + horizontal :

Card principale glassmorphism (max-w-md) :
- Logo PNAVIM-CI en haut (gradient terre)
- Avatar Tantie Sagesse (w-24 h-24) avec glow
- Titre : "Bienvenue ! 👋"
- Sous-titre : "Connecte-toi pour continuer"
- Motif Wax (opacity 5%)

Form :
- Input Téléphone :
  * backdrop-blur-xl bg-white/90
  * border-2 border-white/40
  * focus:border-[#C25E00]
  * rounded-2xl
  * px-6 py-4
  * placeholder: "Numéro de téléphone"

- Input Code :
  * Idem style
  * placeholder: "Code secret"

- Bouton Connexion :
  * rounded-full
  * bg-gradient-to-r from-[#E67E22] to-[#C25E00]
  * shadow-forte
  * text-white font-bold text-lg
  * w-full h-14
  * "Se connecter"

- Lien "Mot de passe oublié ?"
  * text-[#C25E00]
  * text-sm

Footer :
- "Pas encore inscrit ?"
- Lien "Créer un compte" (color terre, font-bold)

Options connexion sociale :
- Bouton Google (glassmorphism blanc)
- Bouton Téléphone (glassmorphism blanc)

=== COMPORTEMENTS ===
- Validation en temps réel
- Erreurs en rouge
- Success en vert manioc
- Loading state sur bouton

=== MOBILE ===
- Card pleine largeur avec padding
- Inputs full-width

=== RÉSULTAT ===
Page de connexion accueillante avec Tantie,
form glassmorphism, et ambiance chaleureuse.
```

---

## 6. Profil Marchand

```
Génère une page profil marchand PNAVIM-CI
(React + Tailwind + shadcn/ui) conforme au Design System.

=== STYLE GLOBAL ===
Palette : Terre #C25E00, Manioc #2E7D32, Moutarde #F1C40F
Typo : Nunito (titres), Inter (body)
Look : glassmorphism + motifs

=== FOND ===
- Photo marché + overlay terre

=== LAYOUT ===
Header :
- Titre "MON PROFIL"
- Avatar marchand (w-32 h-32) avec border terre

Section Infos (cards glassmorphism) :
- Card Identité :
  * Nom complet
  * Numéro marchand
  * Téléphone
  * Marché d'affectation
  * Badge "✅ Vérifié" vert

- Card Statistiques :
  * Total ventes (gradient terre)
  * Transactions (nombre)
  * Épargne actuelle (gradient moutarde)
  * Graphique mini (Chart.js)

- Card Protection Sociale :
  * CNPS (badge actif/inactif)
  * CMU (badge actif/inactif)
  * RSTI (badge actif/inactif)
  * Dates d'expiration

Actions :
Boutons pilules glassmorphism :
- "Modifier profil" (gradient terre)
- "Paramètres" (gradient manioc)
- "Historique" (gradient moutarde)
- "Déconnexion" (outline rouge)

=== COMPORTEMENTS ===
- Click badges : détails couverture
- Click stats : voir historique complet
- Edit mode : inputs editables

=== MOBILE ===
- Cards empilées
- Stats en grid 2x2

=== RÉSULTAT ===
Profil complet avec infos claires,
stats visuelles, et gestion protection sociale.
```

---

## 🎨 Snippets Réutilisables

### Fond Standard

```
Background : photo marché floutée
Filter : brightness(0.85) saturate(1.3) contrast(1.05)
Overlay : dégradé from-[#D35400]/35 via-[#E67E22]/25 to-[#27AE60]/30
```

### Card Glassmorphism Standard

```
backdrop-blur-2xl
bg-white/85
border-2 border-white/25
rounded-3xl
p-6
shadow-[0_8px_32px_rgba(0,0,0,0.12)]
hover:shadow-[0_16px_48px_rgba(0,0,0,0.18)]
```

### Bouton CTA Standard

```
rounded-full
bg-gradient-to-r from-[#E67E22] to-[#C25E00]
hover:from-[#D35400] hover:to-[#A04000]
shadow-[0_4px_14px_rgba(194,94,0,0.39)]
text-white font-heading font-bold
h-14 px-8
transform hover:scale-105
transition-all duration-300
border-2 border-white/30
```

### Motif Wax

```
<div className="absolute inset-0 text-[#C25E00] opacity-[0.05] pointer-events-none">
  {/* Motif SVG ici */}
</div>
```

---

## ✅ Checklist Post-Génération

Après génération par Lovable, vérifier :

- [ ] Background marché présent et vibrant
- [ ] Glassmorphism appliqué (`backdrop-blur`)
- [ ] Motifs Wax sur éléments clés
- [ ] Couleurs PNAVIM respectées
- [ ] Boutons pilules (`rounded-full`)
- [ ] Ombres fortes sur CTA
- [ ] Texte >= 16px partout
- [ ] Touch targets >= 48px
- [ ] Animations 300ms
- [ ] Responsive mobile-first

---

## 🚀 Workflow Idéal

1. **Choisir** le prompt adapté à la page
2. **Copier-coller** dans Lovable
3. **Générer** le code
4. **Vérifier** la checklist
5. **Ajuster** si nécessaire (motifs, couleurs)
6. **Tester** mobile et desktop
7. **Valider** avec l'équipe

---

*Mis à jour : 03 Janvier 2026*
*Pour toute nouvelle page, adapter le template universel*
