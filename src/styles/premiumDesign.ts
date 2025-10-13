/**
 * Premium Design System - $50K Level UI
 * Mobile-first, Glassmorphism, Modern Gradients
 */

export const premiumColors = {
  // Deep sophisticated background gradients
  bgGradient: {
    primary: "bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900",
    secondary: "bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950",
    accent: "bg-gradient-to-br from-indigo-950 via-purple-950 to-pink-950",
    subtle:
      "bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95",
  },

  // Glassmorphism effects
  glass: {
    light: "bg-white/10 backdrop-blur-xl border border-white/20",
    medium: "bg-white/5 backdrop-blur-2xl border border-white/10",
    dark: "bg-black/20 backdrop-blur-xl border border-white/10",
    card: "bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-2xl border border-white/20",
    hover:
      "hover:bg-white/15 hover:border-white/30 hover:shadow-2xl hover:shadow-purple-500/20",
  },

  // Accent gradients for CTAs and highlights
  accentGradient: {
    purple: "bg-gradient-to-r from-purple-600 to-pink-600",
    blue: "bg-gradient-to-r from-blue-600 to-cyan-600",
    teal: "bg-gradient-to-r from-teal-600 to-emerald-600",
    gold: "bg-gradient-to-r from-amber-500 to-orange-600",
    premium: "bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600",
  },

  // Text colors with high contrast
  text: {
    primary: "text-white",
    secondary: "text-slate-200",
    muted: "text-slate-400",
    accent: "text-purple-400",
    success: "text-emerald-400",
    warning: "text-amber-400",
    error: "text-rose-400",
    highlight:
      "text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400",
  },
};

export const premiumShadows = {
  glow: {
    purple: "shadow-2xl shadow-purple-500/50",
    blue: "shadow-2xl shadow-blue-500/50",
    teal: "shadow-2xl shadow-teal-500/50",
    pink: "shadow-2xl shadow-pink-500/50",
    subtle: "shadow-xl shadow-black/50",
  },
  card: "shadow-xl shadow-black/20",
  cardHover: "hover:shadow-2xl hover:shadow-purple-500/30",
  subtle: "shadow-xl shadow-black/50",
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
    ${premiumColors.accentGradient.premium}
    ${premiumBorderRadius.button}
    ${premiumShadows.glow.purple}
    ${premiumAnimations.transition}
    hover:shadow-purple-500/70 hover:scale-105
    active:scale-95
    text-white font-semibold
    px-6 py-3
  `.trim(),

  secondary: `
    ${premiumColors.glass.light}
    ${premiumBorderRadius.button}
    ${premiumAnimations.transition}
    hover:bg-white/20
    text-white font-semibold
    px-6 py-3
  `.trim(),

  ghost: `
    ${premiumBorderRadius.button}
    ${premiumAnimations.transition}
    hover:bg-white/10
    text-slate-200 font-medium
    px-4 py-2
  `.trim(),
};

export const premiumInput = `
  ${premiumColors.glass.light}
  ${premiumBorderRadius.input}
  ${premiumAnimations.transitionFast}
  focus:bg-white/15 focus:border-purple-400/50 focus:outline-none focus:ring-2 focus:ring-purple-400/30
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
    ${premiumColors.accentGradient.teal}
    ${premiumBorderRadius.badge}
    ${premiumShadows.glow.teal}
    text-white text-xs font-bold
    px-3 py-1
  `.trim(),

  warning: `
    ${premiumColors.accentGradient.gold}
    ${premiumBorderRadius.badge}
    ${premiumShadows.glow.subtle}
    text-white text-xs font-bold
    px-3 py-1
  `.trim(),

  error: `
    bg-gradient-to-r from-rose-600 to-red-600
    ${premiumBorderRadius.badge}
    shadow-xl shadow-rose-500/50
    text-white text-xs font-bold
    px-3 py-1
  `.trim(),

  info: `
    ${premiumColors.accentGradient.blue}
    ${premiumBorderRadius.badge}
    ${premiumShadows.glow.blue}
    text-white text-xs font-bold
    px-3 py-1
  `.trim(),
};

// Responsive navbar
export const premiumNavbar = {
  container: `
    ${premiumColors.glass.light}
    border-b border-white/10
    backdrop-blur-2xl
    sticky top-0 z-50
    ${premiumShadows.subtle}
  `.trim(),

  link: `
    ${premiumAnimations.transitionFast}
    hover:bg-white/10
    ${premiumBorderRadius.subtle}
    px-4 py-2
    text-slate-200 hover:text-white
    font-medium
  `.trim(),

  linkActive: `
    ${premiumColors.accentGradient.premium}
    ${premiumBorderRadius.subtle}
    ${premiumShadows.glow.purple}
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
    bg-white/5
    border-b border-white/10
    text-slate-300 text-xs font-semibold uppercase tracking-wider
    px-6 py-4
  `.trim(),

  row: `
    border-b border-white/5
    hover:bg-white/5
    ${premiumAnimations.transitionFast}
    text-slate-200
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
