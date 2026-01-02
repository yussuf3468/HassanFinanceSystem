/**
 * Professional POS Design System - Bookstore Theme
 * Clean, readable, amber/stone palette for financial applications
 */

export const premiumColors = {
  // Clean professional backgrounds
  bgGradient: {
    primary: "bg-stone-50",
    secondary: "bg-neutral-50",
    accent: "bg-gradient-to-br from-amber-50 to-stone-50",
    subtle: "bg-white",
  },

  // Solid cards (no glassmorphism for POS)
  glass: {
    light: "bg-white border border-stone-200",
    medium: "bg-white border border-stone-300",
    dark: "bg-stone-100 border border-stone-200",
    card: "bg-white border border-stone-200 shadow-sm",
    hover: "hover:border-amber-500 hover:shadow-lg hover:shadow-amber-200",
  },

  // Accent gradients for CTAs and highlights
  accentGradient: {
    purple: "bg-gradient-to-r from-amber-500 to-amber-600",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600",
    teal: "bg-gradient-to-r from-teal-600 to-emerald-600",
    gold: "bg-gradient-to-r from-amber-500 to-amber-600",
    premium: "bg-gradient-to-r from-amber-500 to-amber-600",
  },

  // Text colors with high contrast
  text: {
    primary: "text-slate-800",
    secondary: "text-slate-700",
    muted: "text-slate-600",
    accent: "text-amber-700",
    success: "text-emerald-800",
    warning: "text-amber-800",
    error: "text-rose-800",
    highlight:
      "text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-700",
  },
};

export const premiumShadows = {
  glow: {
    purple: "shadow-lg shadow-amber-200",
    blue: "shadow-lg shadow-blue-200",
    teal: "shadow-lg shadow-teal-200",
    pink: "shadow-lg shadow-rose-200",
    subtle: "shadow-md shadow-stone-200",
  },
  card: "shadow-sm shadow-stone-200",
  cardHover: "hover:shadow-lg hover:shadow-amber-200",
  subtle: "shadow-md shadow-stone-200",
};

export const premiumTypography = {
  // Hero headings
  hero: "text-4xl md:text-5xl lg:text-6xl font-black tracking-tight",
  // Section headings
  h1: "text-3xl md:text-4xl font-bold tracking-tight",
  h2: "text-2xl md:text-3xl font-bold tracking-tight",
  h3: "text-xl md:text-2xl font-semibold",
  h4: "text-lg md:text-xl font-semibold",
  // Body text
  body: "text-base md:text-lg",
  bodySmall: "text-sm md:text-base",
  caption: "text-xs md:text-sm",
  // Numbers and data
  dataLarge: "text-3xl md:text-4xl lg:text-5xl font-black tracking-tight",
  dataMedium: "text-2xl md:text-3xl font-bold",
  dataSmall: "text-xl md:text-2xl font-semibold",
  // Special
  label: "text-xs font-semibold uppercase tracking-wider",
};

export const premiumSpacing = {
  section: "py-8 md:py-12 lg:py-16",
  container: "px-4 sm:px-6 lg:px-8",
  card: "p-6 md:p-8",
  cardSmall: "p-4 md:p-6",
  gap: {
    xs: "gap-2",
    sm: "gap-3 md:gap-4",
    md: "gap-4 md:gap-6",
    lg: "gap-6 md:gap-8",
    xl: "gap-8 md:gap-12",
  },
};

export const premiumBorderRadius = {
  card: "rounded-2xl",
  button: "rounded-xl",
  input: "rounded-xl",
  badge: "rounded-full",
  subtle: "rounded-lg",
};

export const premiumAnimations = {
  transition: "transition-all duration-300 ease-in-out",
  transitionSlow: "transition-all duration-500 ease-in-out",
  transitionFast: "transition-all duration-150 ease-in-out",
  hover: "hover:scale-105 hover:-translate-y-1",
  hoverSubtle: "hover:scale-102",
  fadeIn: "animate-fadeIn",
  slideUp: "animate-slideUp",
};

// Composite utility classes
export const premiumCard = `
  ${premiumColors.glass.card}
  ${premiumBorderRadius.card}
  ${premiumShadows.card}
  ${premiumAnimations.transition}
  ${premiumColors.glass.hover}
`.trim();

export const premiumButton = {
  primary: `
    bg-gradient-to-r from-emerald-600 to-teal-600
    ${premiumBorderRadius.button}
    shadow-lg shadow-emerald-400/30
    ${premiumAnimations.transition}
    hover:shadow-2xl hover:shadow-emerald-400/40 hover:scale-105
    active:scale-95
    text-white font-semibold
    px-6 py-3
  `.trim(),

  secondary: `
    ${premiumColors.glass.light}
    ${premiumBorderRadius.button}
    ${premiumAnimations.transition}
    hover:bg-stone-100
    text-slate-800 font-semibold
    px-6 py-3
  `.trim(),

  ghost: `
    ${premiumBorderRadius.button}
    ${premiumAnimations.transition}
    hover:bg-stone-100
    text-slate-700 font-medium
    px-4 py-2
  `.trim(),
};

export const premiumInput = `
  ${premiumColors.glass.light}
  ${premiumBorderRadius.input}
  ${premiumAnimations.transitionFast}
  focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30
  ${premiumColors.text.primary}
  placeholder:text-slate-400
  px-4 py-3
`.trim();

// Grid layouts
export const premiumGrid = {
  stats: "grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
  cards: "grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8",
  products:
    "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6",
};

// Status badges
export const premiumBadge = {
  success: `
    bg-gradient-to-br from-emerald-50/80 to-teal-50/60
    ${premiumBorderRadius.badge}
    border border-emerald-200/60
    shadow-sm
    text-emerald-800 text-xs font-bold
    px-3 py-1
  `.trim(),

  warning: `
    bg-gradient-to-br from-amber-50/80 to-orange-50/60
    ${premiumBorderRadius.badge}
    border border-amber-200/60
    shadow-sm
    text-amber-900 text-xs font-bold
    px-3 py-1
  `.trim(),

  error: `
    bg-gradient-to-br from-rose-50/80 to-red-50/60
    ${premiumBorderRadius.badge}
    border border-rose-200/60
    shadow-sm
    text-rose-800 text-xs font-bold
    px-3 py-1
  `.trim(),

  info: `
    bg-gradient-to-br from-blue-50/80 to-sky-50/60
    ${premiumBorderRadius.badge}
    border border-blue-200/60
    shadow-sm
    text-blue-800 text-xs font-bold
    px-3 py-1
  `.trim(),
};

// Responsive navbar
export const premiumNavbar = {
  container: `
    ${premiumColors.glass.light}
    border-b border-stone-200
    sticky top-0 z-50
    ${premiumShadows.subtle}
  `.trim(),

  link: `
    ${premiumAnimations.transitionFast}
    hover:bg-stone-100
    ${premiumBorderRadius.subtle}
    px-4 py-2
    text-slate-600 hover:text-slate-800
    font-medium
  `.trim(),

  linkActive: `
    bg-amber-500
    ${premiumBorderRadius.subtle}
    shadow-sm shadow-amber-200
    px-4 py-2
    text-white
    font-semibold
  `.trim(),
};

// Table styles
export const premiumTable = {
  container: `
    ${premiumColors.glass.card}
    ${premiumBorderRadius.card}
    overflow-hidden
  `.trim(),

  header: `
    bg-stone-100
    border-b border-stone-200
    text-slate-700 text-xs font-semibold uppercase tracking-wider
    px-6 py-4
  `.trim(),

  row: `
    border-b border-stone-100
    hover:bg-stone-50
    ${premiumAnimations.transitionFast}
    text-slate-800
    px-6 py-4
  `.trim(),

  cell: "px-6 py-4 text-sm",
};

export default {
  colors: premiumColors,
  shadows: premiumShadows,
  typography: premiumTypography,
  spacing: premiumSpacing,
  borderRadius: premiumBorderRadius,
  animations: premiumAnimations,
  card: premiumCard,
  button: premiumButton,
  input: premiumInput,
  grid: premiumGrid,
  badge: premiumBadge,
  navbar: premiumNavbar,
  table: premiumTable,
};
