/**
 * Global Text Visibility for Professional POS Theme
 * Apply these classes to ensure text remains visible
 */

export const textVisibility = {
  // Primary text - Always visible
  primary: "text-slate-800",

  // Secondary text - Slightly dimmed but still visible
  secondary: "text-slate-600",

  // Muted text - For less important information
  muted: "text-slate-500",

  // Error/Warning/Success states
  error: "text-red-600",
  warning: "text-amber-600",
  success: "text-emerald-600",
  info: "text-blue-600",

  // Headings
  heading: "text-slate-900 font-bold",
  subheading: "text-slate-700 font-semibold",

  // Data/Numbers - High emphasis
  data: "text-slate-900 font-black",

  // Labels
  label: "text-slate-600 font-medium",

  // Links
  link: "text-amber-600 hover:text-amber-700",
};

// Input styles that work with light background
export const inputStyles = {
  base: "bg-white border-stone-300 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-amber-500",
  error: "bg-white border-red-400 text-slate-800 placeholder:text-slate-400",
};

// Button text
export const buttonText = {
  primary: "text-white font-semibold",
  secondary: "text-slate-800 font-medium",
  ghost: "text-slate-700 hover:text-slate-900 font-medium",
};

// Table text visibility
export const tableText = {
  header: "text-slate-700 font-semibold uppercase text-xs tracking-wider",
  cell: "text-slate-800 text-sm",
  cellBold: "text-slate-900 font-semibold text-sm",
  cellMuted: "text-slate-500 text-sm",
};

// Card text on clean backgrounds
export const cardText = {
  title: "text-slate-900 font-bold text-lg",
  subtitle: "text-slate-600 text-sm",
  body: "text-slate-700 text-sm",
  caption: "text-slate-500 text-xs",
};
