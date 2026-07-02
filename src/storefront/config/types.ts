import type { Product } from "../../types";

/* ═══════════════════════════════════════════════════════════════
   STORE CONFIG — the white-label contract.

   Everything a merchant-specific storefront needs lives here:
   identity, theme, copy, category metadata, collections, offers,
   testimonials, FAQs, delivery rules. The React code never
   hard-codes a vertical ("books") — it renders whatever config
   it is given, so the same experience serves a pharmacy, a
   furniture showroom or a hardware store.
   ═══════════════════════════════════════════════════════════════ */

export interface StoreTheme {
  /** Primary brand color (buttons, highlights). */
  accent: string;
  /** Darker shade of accent for pressed/hover states. */
  accentDeep: string;
  /** Text/icon color rendered on top of accent. */
  accentInk: string;
  /** Low-opacity accent for tints and pills. */
  accentSoft: string;
  /** Glow used in the hero aurora + accent shadows. */
  accentGlow: string;
  /** Secondary warm highlight (badges, stars, eyebrow text). */
  gold: string;
}

export interface CategoryMeta {
  slug: string;
  label: string;
  /** Lower-case fragments matched against the raw product category. */
  keywords: string[];
  tagline: string;
  /** Fallback image when no product in the category has one. */
  image: string;
}

export type CollectionRule =
  | { type: "featured" }
  | { type: "new"; days: number }
  | { type: "under-price"; max: number }
  | { type: "categories"; slugs: string[] };

export interface CollectionMeta {
  slug: string;
  title: string;
  tagline: string;
  /** Longer sentence for the collections page. */
  description: string;
  rule: CollectionRule;
  /** Marks the collection for the Offers page. */
  isOffer?: boolean;
}

export interface ValueProp {
  icon: "shield" | "truck" | "sparkles" | "clock" | "wallet" | "headset";
  title: string;
  body: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  detail: string;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface StoreConfig {
  /** Business identity */
  name: string;
  /** Short mark used in the logo tile, e.g. "H". */
  monogram: string;
  tagline: string;
  /** One-line positioning used in footer/about. */
  positioning: string;
  poweredBy: { label: string; url: string };

  theme: StoreTheme;

  currency: { code: string; symbol: string; locale: string };

  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    address: string;
    mapsUrl?: string;
    hours: Array<{ days: string; time: string }>;
  };

  hero: {
    eyebrow: string;
    /** Headline; the word wrapped in *asterisks* renders italic-accented. */
    headline: string;
    subline: string;
    primaryCta: string;
    secondaryCta: string;
  };

  /** Trust ticker items under the hero. */
  ticker: string[];

  categories: CategoryMeta[];
  fallbackCategoryImage: string;

  collections: CollectionMeta[];

  offer: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
  };

  valueProps: ValueProp[];
  testimonials: Testimonial[];

  story: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    stats: Array<{ value: string; label: string }>;
  };

  faqs: FaqItem[];

  delivery: {
    freeThreshold: number;
    /** e.g. "Same-day within Nairobi" */
    promise: string;
    returns: string;
    payment: string;
  };

  newsletter: {
    title: string;
    body: string;
    placeholder: string;
    cta: string;
  };

  /** How many days a product counts as "new". */
  newProductDays: number;

  /**
   * Optional brand extractor. Most small retailers don't track
   * brands — return null and every brand surface auto-hides.
   */
  getBrand?: (product: Product) => string | null;
}
