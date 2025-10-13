/**
 * Global Text Visibility Fix for Dark Backgrounds
 * Apply these classes to ensure text remains visible
 */

export const textVisibility = {
  // Primary text - Always visible
  primary: "text-white",

  // Secondary text - Slightly dimmed but still visible
  secondary: "text-slate-200",

  // Muted text - For less important information
  muted: "text-slate-400",

  // Error/Warning/Success states
  error: "text-rose-400",
  warning: "text-amber-400",
  success: "text-emerald-400",
  info: "text-blue-400",

  // Headings
  heading: "text-white font-bold",
  subheading: "text-slate-200 font-semibold",

  // Data/Numbers - High emphasis
  data: "text-white font-black",

  // Labels
  label: "text-slate-300 font-medium",

  // Links
  link: "text-purple-400 hover:text-purple-300",
};

// Input styles that work with dark background
export const inputStyles = {
  base: "bg-white/10 border-white/20 text-white placeholder:text-slate-400 focus:bg-white/15 focus:border-purple-400/50",
  error: "bg-white/10 border-rose-400/50 text-white placeholder:text-slate-400",
};

// Button text that works with gradients
export const buttonText = {
  primary: "text-white font-semibold",
  secondary: "text-slate-200 font-medium",
  ghost: "text-slate-200 hover:text-white font-medium",
};

// Table text visibility
export const tableText = {
  header: "text-slate-300 font-semibold uppercase text-xs tracking-wider",
  cell: "text-slate-200 text-sm",
  cellBold: "text-white font-semibold text-sm",
  cellMuted: "text-slate-400 text-sm",
};

// Card text on glassmorphic backgrounds
export const cardText = {
  title: "text-white font-bold text-lg",
  subtitle: "text-slate-300 text-sm",
  body: "text-slate-200 text-sm",
  caption: "text-slate-400 text-xs",
};
