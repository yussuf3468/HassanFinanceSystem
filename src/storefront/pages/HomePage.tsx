import { useMemo, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Headphones,
  Quote,
  ShieldCheck,
  Sparkles,
  Truck,
  Wallet,
} from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import ProductCard from "../components/ProductCard";
import ProductRail from "../components/ProductRail";
import {
  Container,
  GhostButton,
  ProductGridSkeleton,
  Reveal,
  SectionHeader,
  SolidButton,
} from "../components/ui";
import { storeConfig } from "../config/store";
import {
  formatMoney,
  productsForCollection,
  useCatalog,
} from "../lib/catalog";
import { Link } from "../lib/router";
import type { Product } from "../../types";

/* ═══════════════════════════════════════════════════════════════
   HOME — a guided story: cinematic hero → collections →
   categories → featured → values → voices → arrivals → offer →
   story → FAQ. The newsletter lives in the footer band.
   ═══════════════════════════════════════════════════════════════ */

const VALUE_ICONS = {
  shield: ShieldCheck,
  truck: Truck,
  sparkles: Sparkles,
  clock: Clock,
  wallet: Wallet,
  headset: Headphones,
} as const;

/** Render "*word*" markers in the headline as italic serif accents. */
function Headline({ text }: { text: string }) {
  const parts = text.split(/\*([^*]+)\*/);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <em key={i} className="font-light italic" style={{ color: "var(--sf-gold)" }}>
            {part}
          </em>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

export default function HomePage() {
  const { products, categories, isLoading } = useCatalog();

  const featured = useMemo(
    () => products.filter((p) => p.featured && p.quantity_in_stock > 0).slice(0, 8),
    [products],
  );
  const latest = useMemo(
    () =>
      [...products]
        .filter((p) => p.quantity_in_stock > 0)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        .slice(0, 10),
    [products],
  );
  const heroProducts = useMemo(
    () =>
      products
        .filter((p) => p.image_url && p.quantity_in_stock > 0)
        .slice(0, 3),
    [products],
  );

  return (
    <div>
      <Hero heroProducts={heroProducts} />
      <TrustTicker />
      <CollectionsSection products={products} />
      <CategoriesSection categories={categories} />

      {/* Featured products */}
      <section className="py-16 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Hand-picked"
              title="Featured this week"
              description="The pieces our team keeps recommending — proven favourites, always in stock."
              linkTo="/products?sort=featured"
            />
          </Reveal>
          {isLoading ? (
            <ProductGridSkeleton count={8} />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {(featured.length > 0 ? featured : latest.slice(0, 8)).map(
                (product, index) => (
                  <Reveal key={product.id} delay={Math.min(index * 0.06, 0.3)}>
                    <ProductCard product={product} priority={index < 4} />
                  </Reveal>
                ),
              )}
            </div>
          )}
        </Container>
      </section>

      <ValuePropsSection />
      <TestimonialsSection />

      {/* Latest arrivals */}
      <section className="py-16 sm:py-24">
        <Container>
          <Reveal>
            <SectionHeader
              eyebrow="Just in"
              title="Latest arrivals"
              description="Fresh stock lands every week. Here's what just hit the shelves."
              linkTo="/products?sort=newest"
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ProductRail products={latest} />
          </Reveal>
        </Container>
      </section>

      <OfferBanner />
      <StorySection />
      <FaqSection />
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────── */

function Hero({ heroProducts }: { heroProducts: Product[] }) {
  const reduced = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const cardsY = useTransform(scrollYProgress, [0, 1], [0, -90]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const { hero } = storeConfig;

  return (
    <section
      ref={sectionRef}
      className="sf-grain relative overflow-hidden"
      style={{ background: "var(--sf-dark)" }}
    >
      <div className="sf-aurora" />
      {/* Horizon glow at the base */}
      <div
        className="absolute inset-x-0 bottom-0 h-24"
        style={{
          background: "linear-gradient(to top, var(--sf-bg), transparent)",
          zIndex: 2,
        }}
      />

      <Container className="relative z-[3] grid grid-cols-1 items-center gap-10 pb-20 pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:pb-24 lg:pt-28">
        {/* Copy */}
        <motion.div style={reduced ? undefined : { y: copyY, opacity: fade }}>
          <motion.p
            className="sf-eyebrow mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              color: "var(--sf-dark-ink)",
              background: "rgba(255,255,255,0.07)",
              border: "1px solid var(--sf-dark-line)",
            }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <Sparkles className="h-3.5 w-3.5" style={{ color: "var(--sf-gold)" }} />
            {hero.eyebrow}
          </motion.p>

          <motion.h1
            className="sf-display sf-balance text-[2.75rem] font-medium leading-[1.04] sm:text-6xl lg:text-[4.5rem]"
            style={{ color: "var(--sf-dark-ink)" }}
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Headline text={hero.headline} />
          </motion.h1>

          <motion.p
            className="mt-6 max-w-md text-[16px] leading-relaxed sm:text-lg"
            style={{ color: "var(--sf-dark-ink-soft)" }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            {hero.subline}
          </motion.p>

          <motion.div
            className="mt-9 flex flex-wrap items-center gap-3.5"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <SolidButton to="/products">
              {hero.primaryCta}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </SolidButton>
            <GhostButton to="/categories" dark>
              {hero.secondaryCta}
            </GhostButton>
          </motion.div>
        </motion.div>

        {/* Floating product glass cards */}
        <motion.div
          className="relative hidden h-[460px] lg:block"
          style={reduced ? undefined : { y: cardsY }}
        >
          {heroProducts.map((product, index) => {
            const positions = [
              "left-2 top-6 w-56 rotate-[-5deg]",
              "right-2 top-0 w-48 rotate-[4deg]",
              "left-1/3 bottom-0 w-52 rotate-[2deg]",
            ];
            return (
              <motion.div
                key={product.id}
                className={`absolute ${positions[index]} ${
                  index === 1 ? "sf-float-delayed" : "sf-float"
                }`}
                initial={{ opacity: 0, y: 60, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.9,
                  delay: 0.4 + index * 0.18,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Link
                  to={`/product/${product.id}`}
                  className="sf-glass-dark block overflow-hidden rounded-3xl p-3 transition-transform duration-500 hover:scale-[1.04]"
                >
                  <div
                    className="aspect-[4/5] overflow-hidden rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.06)" }}
                  >
                    <OptimizedImage
                      src={product.image_url}
                      alt={product.name}
                      priority
                      preset="medium"
                      className="h-full w-full object-cover"
                      fallbackClassName="h-full w-full"
                    />
                  </div>
                  <div className="px-1.5 pb-1 pt-3">
                    <p
                      className="truncate text-[13px] font-medium"
                      style={{ color: "var(--sf-dark-ink)" }}
                    >
                      {product.name}
                    </p>
                    <p
                      className="sf-tabular mt-0.5 text-[13px] font-semibold"
                      style={{ color: "var(--sf-gold)" }}
                    >
                      {formatMoney(product.selling_price)}
                    </p>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </Container>

      {/* Scroll cue */}
      <motion.div
        className="absolute bottom-7 left-1/2 z-[3] -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 1 }}
        style={reduced ? undefined : { opacity: fade }}
      >
        <ChevronDown
          className="h-6 w-6 animate-bounce"
          style={{ color: "var(--sf-dark-ink-soft)" }}
        />
      </motion.div>
    </section>
  );
}

/* ── Trust ticker ───────────────────────────────────────────── */

function TrustTicker() {
  const items = storeConfig.ticker;
  const track = (
    <div className="sf-marquee-track gap-0">
      {items.map((item, i) => (
        <span
          key={i}
          className="flex items-center gap-3 whitespace-nowrap px-6 text-[13px] font-medium"
          style={{ color: "var(--sf-ink-soft)" }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ background: "var(--sf-gold)" }}
          />
          {item}
        </span>
      ))}
    </div>
  );
  return (
    <div
      className="sf-marquee border-y py-4"
      style={{ borderColor: "var(--sf-line)", background: "var(--sf-surface)" }}
      aria-hidden
    >
      {track}
      {track}
    </div>
  );
}

/* ── Collections ────────────────────────────────────────────── */

function CollectionsSection({ products }: { products: Product[] }) {
  const collections = storeConfig.collections.slice(0, 3);
  if (collections.length === 0) return null;

  return (
    <section className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="Curated for you"
            title="Featured collections"
            description="Not sure where to start? Begin with an edit our team has already curated."
            linkTo="/collections"
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {collections.map((collection, index) => {
            const items = productsForCollection(products, collection);
            const cover = items.find((p) => p.image_url)?.image_url;
            const tall = index === 0;
            return (
              <Reveal
                key={collection.slug}
                delay={index * 0.08}
                className={tall ? "md:row-span-2" : ""}
              >
                <Link
                  to={`/collections/${collection.slug}`}
                  className={`group relative block overflow-hidden rounded-3xl ${
                    tall ? "aspect-[4/5] md:h-full md:aspect-auto" : "aspect-[4/3]"
                  }`}
                  style={{ background: "var(--sf-dark-soft)" }}
                >
                  {cover ? (
                    <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]">
                      <OptimizedImage
                        src={cover}
                        alt={collection.title}
                        preset="large"
                        className="h-full w-full object-cover"
                        fallbackClassName="h-full w-full"
                      />
                    </div>
                  ) : (
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--sf-accent-deep), var(--sf-dark))",
                      }}
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(10,9,7,0.82) 0%, rgba(10,9,7,0.25) 55%, rgba(10,9,7,0.05) 100%)",
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                    <p className="sf-eyebrow mb-2" style={{ color: "var(--sf-gold)" }}>
                      {collection.tagline}
                    </p>
                    <h3
                      className="sf-display text-2xl font-medium sm:text-[1.7rem]"
                      style={{ color: "var(--sf-dark-ink)" }}
                    >
                      {collection.title}
                    </h3>
                    <p
                      className="mt-2 flex items-center gap-2 text-[13.5px] font-semibold"
                      style={{ color: "var(--sf-dark-ink)" }}
                    >
                      {items.length > 0 ? `${items.length} products` : "Explore"}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                    </p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ── Categories rail ────────────────────────────────────────── */

function CategoriesSection({
  categories,
}: {
  categories: ReturnType<typeof useCatalog>["categories"];
}) {
  if (categories.length === 0) return null;
  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--sf-bg-soft)" }}>
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="Browse the aisles"
            title="Popular categories"
            linkTo="/categories"
          />
        </Reveal>
      </Container>
      <Reveal delay={0.1}>
        <div className="sf-no-scrollbar sf-snap-rail flex gap-4 overflow-x-auto px-5 pb-2 sm:px-8">
          {categories.map((category) => (
            <Link
              key={category.slug}
              to={`/products?cat=${category.slug}`}
              className="group relative block w-[220px] shrink-0 overflow-hidden rounded-3xl sm:w-[260px]"
            >
              <div
                className="aspect-[3/4] overflow-hidden"
                style={{ background: "var(--sf-dark-soft)" }}
              >
                <div className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]">
                  <OptimizedImage
                    src={category.coverImage}
                    alt={category.label}
                    preset="medium"
                    className="h-full w-full object-cover"
                    fallbackClassName="h-full w-full"
                  />
                </div>
              </div>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(to top, rgba(10,9,7,0.78) 0%, transparent 55%)",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3
                  className="sf-display text-lg font-medium leading-tight"
                  style={{ color: "var(--sf-dark-ink)" }}
                >
                  {category.label}
                </h3>
                <p className="mt-1 text-[12.5px]" style={{ color: "var(--sf-dark-ink-soft)" }}>
                  {category.inStockCount} products
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ── Value props ────────────────────────────────────────────── */

function ValuePropsSection() {
  return (
    <section className="py-16 sm:py-24" style={{ background: "var(--sf-bg-soft)" }}>
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="The promise"
            title={`Why people choose ${storeConfig.name}`}
            align="center"
          />
        </Reveal>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {storeConfig.valueProps.map((prop, index) => {
            const Icon = VALUE_ICONS[prop.icon];
            return (
              <Reveal key={prop.title} delay={index * 0.08}>
                <div
                  className="h-full rounded-3xl p-7 transition-all duration-500 hover:-translate-y-1.5"
                  style={{
                    background: "var(--sf-surface)",
                    border: "1px solid var(--sf-line)",
                    boxShadow: "var(--sf-shadow-sm)",
                  }}
                >
                  <div
                    className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl"
                    style={{ background: "var(--sf-accent-soft)" }}
                  >
                    <Icon className="h-[22px] w-[22px]" style={{ color: "var(--sf-accent)" }} />
                  </div>
                  <h3 className="mb-2 text-[16px] font-semibold" style={{ color: "var(--sf-ink)" }}>
                    {prop.title}
                  </h3>
                  <p className="text-[13.5px] leading-relaxed" style={{ color: "var(--sf-ink-soft)" }}>
                    {prop.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

/* ── Testimonials ───────────────────────────────────────────── */

function TestimonialsSection() {
  if (storeConfig.testimonials.length === 0) return null;
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeader
            eyebrow="In their words"
            title="Loved by the neighbourhood"
            align="center"
          />
        </Reveal>
        <div className="grid gap-5 md:grid-cols-3">
          {storeConfig.testimonials.map((testimonial, index) => (
            <Reveal key={testimonial.name} delay={index * 0.1}>
              <figure
                className={`flex h-full flex-col rounded-3xl p-7 ${
                  index === 1 ? "md:-translate-y-4" : ""
                }`}
                style={{
                  background: "var(--sf-surface)",
                  border: "1px solid var(--sf-line)",
                  boxShadow: "var(--sf-shadow-md)",
                }}
              >
                <Quote
                  className="mb-4 h-7 w-7"
                  style={{ color: "var(--sf-gold)", transform: "scaleX(-1)" }}
                />
                <blockquote
                  className="sf-display flex-1 text-[17px] font-normal italic leading-relaxed"
                  style={{ color: "var(--sf-ink)" }}
                >
                  “{testimonial.quote}”
                </blockquote>
                <figcaption className="mt-6">
                  <p className="text-[14px] font-semibold" style={{ color: "var(--sf-ink)" }}>
                    {testimonial.name}
                  </p>
                  <p className="text-[12.5px]" style={{ color: "var(--sf-ink-faint)" }}>
                    {testimonial.detail}
                  </p>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ── Offer banner ───────────────────────────────────────────── */

function OfferBanner() {
  const { offer } = storeConfig;
  return (
    <section className="py-10 sm:py-14">
      <Container>
        <Reveal>
          <div
            className="sf-grain relative overflow-hidden rounded-[2rem] px-7 py-14 text-center sm:px-14 sm:py-20"
            style={{
              background:
                "linear-gradient(125deg, var(--sf-accent-deep) 0%, var(--sf-accent) 60%, var(--sf-accent-deep) 100%)",
            }}
          >
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
              style={{ background: "rgba(255,255,255,0.1)", filter: "blur(48px)" }}
            />
            <div className="relative z-[2]">
              <p className="sf-eyebrow mb-4" style={{ color: "var(--sf-gold)" }}>
                {offer.eyebrow}
              </p>
              <h2
                className="sf-display sf-balance mx-auto max-w-2xl text-3xl font-medium sm:text-5xl"
                style={{ color: "#ffffff" }}
              >
                {offer.title}
              </h2>
              <p
                className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed sm:text-base"
                style={{ color: "rgba(255,255,255,0.75)" }}
              >
                {offer.body}
              </p>
              <div className="mt-8">
                <Link
                  to="/products"
                  className="inline-flex h-12 items-center gap-2.5 rounded-full bg-white px-8 text-[15px] font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                  style={{ color: "var(--sf-accent-deep)" }}
                >
                  {offer.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── Story ──────────────────────────────────────────────────── */

function StorySection() {
  const { story } = storeConfig;
  return (
    <section className="py-16 sm:py-24">
      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-gold)" }}>
              {story.eyebrow}
            </p>
            <h2
              className="sf-display sf-balance text-3xl font-medium leading-[1.1] sm:text-[2.75rem]"
              style={{ color: "var(--sf-ink)" }}
            >
              {story.title}
            </h2>
            <div className="mt-6 space-y-4">
              {story.paragraphs.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-[15px] leading-relaxed sm:text-base"
                  style={{ color: "var(--sf-ink-soft)" }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="mt-8">
              <GhostButton to="/about">
                Read our full story
                <ArrowRight className="h-4 w-4" />
              </GhostButton>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <div className="grid grid-cols-2 gap-4">
              {story.stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`rounded-3xl p-7 text-center ${
                    index % 2 === 1 ? "translate-y-4" : ""
                  }`}
                  style={{
                    background: index === 0 ? "var(--sf-accent)" : "var(--sf-surface)",
                    border: "1px solid var(--sf-line)",
                    boxShadow: "var(--sf-shadow-sm)",
                  }}
                >
                  <p
                    className="sf-display text-3xl font-semibold sm:text-4xl"
                    style={{
                      color: index === 0 ? "var(--sf-accent-ink)" : "var(--sf-ink)",
                    }}
                  >
                    {stat.value}
                  </p>
                  <p
                    className="mt-2 text-[13px] font-medium"
                    style={{
                      color:
                        index === 0
                          ? "rgba(255,255,255,0.72)"
                          : "var(--sf-ink-soft)",
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </Container>
    </section>
  );
}

/* ── FAQ ────────────────────────────────────────────────────── */

function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);
  if (storeConfig.faqs.length === 0) return null;

  return (
    <section className="pb-20 pt-8 sm:pb-28 sm:pt-12">
      <Container className="max-w-3xl">
        <Reveal>
          <SectionHeader
            eyebrow="Good to know"
            title="Questions, answered"
            align="center"
          />
        </Reveal>
        <div className="space-y-3">
          {storeConfig.faqs.map((faq, index) => {
            const isOpen = open === index;
            return (
              <Reveal key={faq.question} delay={index * 0.05}>
                <div
                  className="overflow-hidden rounded-2xl transition-shadow duration-300"
                  style={{
                    background: "var(--sf-surface)",
                    border: "1px solid var(--sf-line)",
                    boxShadow: isOpen ? "var(--sf-shadow-md)" : "var(--sf-shadow-xs)",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : index)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span
                      className="text-[15px] font-semibold"
                      style={{ color: "var(--sf-ink)" }}
                    >
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                      style={{ color: "var(--sf-ink-faint)" }}
                    />
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p
                        className="px-6 pb-5 text-[14px] leading-relaxed"
                        style={{ color: "var(--sf-ink-soft)" }}
                      >
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
