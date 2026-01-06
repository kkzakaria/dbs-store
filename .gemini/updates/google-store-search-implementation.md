# Mise à jour de l'Appbar et de la Recherche - Style Google Store

## 🎯 Objectif

Adapter l'appbar et la fonctionnalité de recherche de DBS Store pour suivre le
design de Google Store sur desktop et mobile.

## ✨ Changements Effectués

### 1. Nouveau Composant InlineSearch

**Fichier**: `/components/store/Header/components/InlineSearch.tsx`

**Fonctionnalités**:

- ✅ Recherche inline dans le header (icône de recherche)
- ✅ Expansion en overlay full-width au clic (comme Google Store)
- ✅ Backdrop semi-transparent avec dim effect
- ✅ Barre de recherche pill-shaped avec rounded corners
- ✅ Résultats de recherche en temps réel avec debounce
- ✅ Support desktop et mobile
- ✅ Fermeture par Escape ou clic extérieur
- ✅ Animations fluides (slide-in, fade-in)
- ✅ Interface épurée sans suggestions par défaut

**Design**:

- Barre de recherche centrée avec max-width
- Input pill-shaped avec icône de recherche à gauche et bouton X à droite
- Dropdown de résultats avec border radius et shadow Google
- Loader pendant la recherche
- Images de produits dans les résultats

### 2. Mise à Jour du Header

**Fichier**: `/components/store/Header/Header.tsx`

**Modifications**:

- ❌ Supprimé: Ancien `SearchCommand` (dialog modal)
- ✅ Ajouté: Nouveau `InlineSearch` component
- ✅ Intégration dans la section droite du header
- ✅ Fonctionne sur desktop et mobile

### 3. Mise à Jour ActionButtons

**Fichier**: `/components/store/Header/components/ActionButtons.tsx`

**Modifications**:

- ❌ Supprimé: Bouton de recherche (géré par InlineSearch)
- ✅ Conservé: ThemeToggle et Cart
- ✅ Simplifié les props (plus besoin de `onSearchOpen`)

## 🎨 Comparaison avec Google Store

### Desktop

| Aspect             | Google Store          | DBS Store (Nouveau)      |
| ------------------ | --------------------- | ------------------------ |
| Position recherche | Header droite         | ✅ Header droite         |
| Expansion          | Full-width overlay    | ✅ Full-width overlay    |
| Backdrop           | Oui, semi-transparent | ✅ Oui, semi-transparent |
| Input style        | Pill-shaped           | ✅ Pill-shaped           |
| Résultats          | Dropdown              | ✅ Dropdown              |
| Animation          | Slide-in              | ✅ Slide-in              |

### Mobile

| Aspect          | Google Store      | DBS Store (Nouveau)  |
| --------------- | ----------------- | -------------------- |
| Icône recherche | Visible           | ✅ Visible           |
| Expansion       | Full-width        | ✅ Full-width        |
| Comportement    | Identique desktop | ✅ Identique desktop |
| Padding         | Adapté mobile     | ✅ Responsive        |

## 🎬 Comportement de la Recherche

### État Collapsed (Par défaut)

```
[Menu] [Logo] __________________ [🔍] [🌓] [🛒] [👤]
```

### État Expanded (Après clic sur 🔍)

**Sans recherche:**

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║    [🔍] [ Rechercher sur DBS Store.... ]  [✕]    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
     [Fond semi-transparent avec blur]
```

**Avec recherche (ex: "iPhone"):**

```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║    [🔍] [ iPhone_________________ ]  [✕]          ║
║                                                   ║
╠═══════════════════════════════════════════════════╣
║   📦 Produits                                     ║
║   • iPhone 15 Pro - 299€                          ║
║   • iPhone 15 - 249€                              ║
║   • ...                                           ║
║   🔍 Voir tous les résultats pour "iPhone"        ║
╚═══════════════════════════════════════════════════╝
     [Fond semi-transparent avec blur]
```

## 📱 Support Responsive

### Mobile (< 768px)

- Padding réduit: `px-4 py-2.5`
- Gap réduit: `gap-2`
- Container padding: `py-3`

### Desktop (≥ 768px)

- Padding standard: `px-6 py-3`
- Gap standard: `gap-3`
- Container padding: `py-4`

## 🔧 Classes CSS Utilisées

### Google Design System

- `container-google`: Container responsive avec padding adapté
- `shadow-google-md`: Ombre Google pour le header
- `shadow-google-lg`: Ombre Google pour les résultats
- `transition-google`: Transition fluide Google
- `animate-in`: Animations d'entrée
- `slide-in-from-top`: Animation slide depuis le haut
- `fade-in`: Animation fade-in

## 📝 Notes Techniques

### Z-Index Hierarchy

```
60: Backdrop overlay
61: MobileNav (existant)
70: InlineSearch container
```

### État Management

- `searchOpen`: Boolean state dans Header
- `query`: Local state dans InlineSearch
- `results`: Résultats de recherche
- `isSearching`: État de chargement

### Debounce

- Délai: 300ms
- Évite les requêtes excessives pendant la frappe

## 🧪 Tests à Effectuer

### Desktop

- [ ] Clic sur icône de recherche ➜ Overlay s'ouvre
- [ ] Backdrop visible et semi-transparent
- [ ] Input focusé automatiquement
- [ ] Frappe dans l'input ➜ Résultats apparaissent
- [ ] Clic sur résultat ➜ Navigation + fermeture
- [ ] Clic sur backdrop ➜ Fermeture
- [ ] Escape ➜ Fermeture

### Mobile

- [ ] Icône de recherche visible
- [ ] Design responsive (padding adapté)
- [ ] Même comportement que desktop
- [ ] Touch interactions fonctionnent

## 🚀 Prochaines Améliorations Possibles

1. **Historique de recherche** (stocké en localStorage)
2. **Recherche vocale** (Web Speech API)
3. **Suggestions de recherche** (autocomplete avancé)
4. **Filtres rapides** (catégories, prix, marques)
5. **Raccourcis clavier** (Cmd+K / Ctrl+K pour ouvrir)

## 📦 Fichiers Modifiés

```
components/store/Header/
├── Header.tsx                              (modifié)
├── components/
│   ├── ActionButtons.tsx                   (modifié)
│   ├── InlineSearch.tsx                    (nouveau)
│   └── index.ts                            (modifié)
```

## ✅ Vérifications

- [x] TypeScript: Aucune erreur de compilation
- [x] Styles: Toutes les classes CSS sont définies
- [x] Responsive: Padding et spacing adaptés mobile/desktop
- [x] Accessibilité: Labels ARIA, focus management
- [x] Performance: Debounce activé, requêtes optimisées
