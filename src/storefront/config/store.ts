import type { StoreConfig } from "./types";

/* ═══════════════════════════════════════════════════════════════
   HASSAN BOOKSHOP — the first Lenzro storefront.

   This file is the ONLY place that knows this store sells books.
   Swap this config (or load one per tenant) and the exact same
   experience serves electronics, fashion, pharmacy, hardware…
   ═══════════════════════════════════════════════════════════════ */

const hassanBookshop: StoreConfig = {
  name: "Hassan Bookshop",
  monogram: "H",
  tagline: "Everything a curious mind needs.",
  positioning:
    "Eastleigh's trusted home of books, stationery and learning essentials — serving students, parents and professionals since day one.",
  poweredBy: { label: "Lenzro", url: "https://lenzro.com" },

  theme: {
    accent: "#1d5c45",
    accentDeep: "#123c2d",
    accentInk: "#ffffff",
    accentSoft: "rgba(29, 92, 69, 0.09)",
    accentGlow: "rgba(46, 143, 108, 0.35)",
    gold: "#b9863a",
  },

  currency: { code: "KES", symbol: "KSh", locale: "en-KE" },

  contact: {
    phone: "+254 722 979 547 / +254 111 887 793",
    whatsapp: "254722979547",
    email: "yussufh080@gmail.com",
    address: "2nd Street, 3rd Avenue, Eastleigh, Nairobi",
    mapsUrl: "https://maps.google.com/?q=2nd+Street+3rd+Avenue+Eastleigh+Nairobi",
    hours: [
      { days: "Monday – Sunday", time: "8:00 AM – 11:00 PM" },
    ],
  },

  hero: {
    eyebrow: "Eastleigh · Nairobi",
    headline: "Where learning feels *beautiful*",
    subline:
      "Textbooks, stationery and study essentials — hand-picked, fairly priced and delivered to your door across Nairobi.",
    primaryCta: "Shop the collection",
    secondaryCta: "Explore categories",
  },

  ticker: [
    "Free delivery on orders over KSh 2,000",
    "Same-day delivery in Nairobi",
    "M-Pesa, card & cash accepted",
    "100% genuine products",
    "Trusted by 10,000+ customers",
  ],

  categories: [
    {
      slug: "books",
      label: "Books & Textbooks",
      keywords: ["book", "text", "novel", "revision", "cbc"],
      tagline: "Curriculum titles, revision guides and great reads.",
      image:
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=640&q=75&auto=format&fit=crop",
    },
    {
      slug: "notebooks",
      label: "Notebooks & Paper",
      keywords: ["note", "exercise", "paper", "diary", "journal"],
      tagline: "Exercise books, journals and everything paper.",
      image:
        "https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=640&q=75&auto=format&fit=crop",
    },
    {
      slug: "stationery",
      label: "Pens & Stationery",
      keywords: ["pen", "pencil", "station", "marker", "eraser", "ruler"],
      tagline: "Writing instruments and desk essentials.",
      image:
        "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=640&q=75&auto=format&fit=crop",
    },
    {
      slug: "electronics",
      label: "Electronics",
      keywords: ["electron", "gadget", "tech", "usb", "phone", "cable"],
      tagline: "Calculators, accessories and smart gadgets.",
      image:
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=640&q=75&auto=format&fit=crop",
    },
    {
      slug: "bags",
      label: "Bags & Carriers",
      keywords: ["bag", "pack", "carrier"],
      tagline: "School bags and backpacks built to last.",
      image:
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=640&q=75&auto=format&fit=crop",
    },
    {
      slug: "art",
      label: "Art & Craft",
      keywords: ["art", "paint", "color", "craft", "crayon"],
      tagline: "Colour, create and bring ideas to life.",
      image:
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=640&q=75&auto=format&fit=crop",
    },
    {
      slug: "school",
      label: "School Supplies",
      keywords: ["school", "study", "student", "uniform", "geometry"],
      tagline: "Everything on the back-to-school list.",
      image:
        "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=640&q=75&auto=format&fit=crop",
    },
  ],
  fallbackCategoryImage:
    "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=640&q=75&auto=format&fit=crop",

  collections: [
    {
      slug: "editors-picks",
      title: "Editor's Picks",
      tagline: "Our shelf, curated",
      description:
        "The products our team recommends first — proven favourites customers come back for.",
      rule: { type: "featured" },
    },
    {
      slug: "just-arrived",
      title: "Just Arrived",
      tagline: "Fresh on the shelf",
      description: "The newest additions to the store, added in the last month.",
      rule: { type: "new", days: 30 },
    },
    {
      slug: "under-500",
      title: "Under KSh 500",
      tagline: "Small prices, big finds",
      description:
        "Quality picks that keep your budget intact — perfect for topping up an order.",
      rule: { type: "under-price", max: 500 },
      isOffer: true,
    },
    {
      slug: "study-essentials",
      title: "Study Essentials",
      tagline: "The back-to-school edit",
      description:
        "Books, notebooks and supplies — the complete kit for a serious term.",
      rule: { type: "categories", slugs: ["books", "notebooks", "school"] },
    },
  ],

  offer: {
    eyebrow: "Limited time",
    title: "Free delivery over KSh 2,000",
    body: "Fill your basket and we'll bring it to your door anywhere in Nairobi — no delivery fee, no catch.",
    cta: "Start shopping",
  },

  valueProps: [
    {
      icon: "shield",
      title: "Genuine, always",
      body: "Every product is sourced directly from trusted publishers and suppliers. No counterfeits, ever.",
    },
    {
      icon: "truck",
      title: "Same-day delivery",
      body: "Order before 3 PM and receive it today anywhere in Nairobi. Countrywide delivery within 48 hours.",
    },
    {
      icon: "wallet",
      title: "Fair prices",
      body: "We negotiate hard with suppliers so you don't have to. Transparent pricing, no hidden fees.",
    },
    {
      icon: "headset",
      title: "Real human support",
      body: "Call or WhatsApp us any day of the week — a real person who knows the stock will answer.",
    },
  ],

  testimonials: [
    {
      quote:
        "I ordered my daughter's full Form 1 book list at 10 AM and everything arrived before dinner. Every title, correct editions.",
      name: "Amina W.",
      detail: "Parent · South C",
    },
    {
      quote:
        "The only shop in Eastleigh where I know the calculators are original. Prices are better than town.",
      name: "Brian K.",
      detail: "University student",
    },
    {
      quote:
        "We furnish our whole office with their stationery. Ordering takes five minutes and delivery is always on time.",
      name: "Halima A.",
      detail: "Office manager · Eastleigh",
    },
  ],

  story: {
    eyebrow: "Our story",
    title: "A neighbourhood shop with a big promise",
    paragraphs: [
      "Hassan Bookshop began as a single shelf of textbooks on 3rd Avenue, Eastleigh. The promise was simple: genuine products, honest prices, and a smile.",
      "Today we serve thousands of students, parents, schools and offices across Nairobi — same values, much bigger shelves. When you buy from us, you're buying from neighbours who care whether your term goes well.",
    ],
    stats: [
      { value: "10,000+", label: "Happy customers" },
      { value: "2,500+", label: "Products in stock" },
      { value: "Same-day", label: "Nairobi delivery" },
      { value: "7 days", label: "Open every week" },
    ],
  },

  faqs: [
    {
      question: "How fast is delivery?",
      answer:
        "Orders placed before 3 PM are delivered the same day within Nairobi. Orders outside Nairobi arrive within 24–48 hours via courier. Delivery is free for orders over KSh 2,000.",
    },
    {
      question: "How do I pay?",
      answer:
        "We accept M-Pesa, card, bank transfer, and cash on delivery. For M-Pesa you'll receive payment details at checkout and can attach your confirmation.",
    },
    {
      question: "Can I return a product?",
      answer:
        "Yes — unused products in original condition can be returned or exchanged within 7 days. Just bring your receipt or order number, or call us and we'll arrange pickup.",
    },
    {
      question: "Do you supply schools and offices?",
      answer:
        "Absolutely. We handle bulk orders for schools, offices and institutions with special pricing. Call or WhatsApp us with your list and we'll quote within the hour.",
    },
    {
      question: "How do I track my order?",
      answer:
        "Every order gets an order number at checkout. Use the Track Order page — or the link in your confirmation — to see live status from confirmation to delivery.",
    },
  ],

  delivery: {
    freeThreshold: 2000,
    promise: "Same-day delivery within Nairobi · 24–48h countrywide",
    returns: "7-day hassle-free returns on unused items",
    payment: "M-Pesa, card, bank transfer or cash on delivery",
  },

  newsletter: {
    title: "First to know",
    body: "New arrivals, restocks and subscriber-only offers. One short email a week — no noise.",
    placeholder: "Your email address",
    cta: "Subscribe",
  },

  newProductDays: 30,
};

export const storeConfig: StoreConfig = hassanBookshop;
