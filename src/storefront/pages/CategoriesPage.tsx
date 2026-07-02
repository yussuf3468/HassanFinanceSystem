import { ArrowRight } from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import { Container, EmptyState, Reveal, SolidButton } from "../components/ui";
import { useCatalog } from "../lib/catalog";
import { Link } from "../lib/router";

/* ═══════════════════════════════════════════════════════════════
   CATEGORIES — a full-bleed editorial index of every aisle,
   built from live catalog data (covers come from real products).
   ═══════════════════════════════════════════════════════════════ */

export default function CategoriesPage() {
  const { categories, isLoading } = useCatalog();

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <Container>
        <Reveal>
          <div className="mb-10 max-w-2xl sm:mb-14">
            <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-gold)" }}>
              The aisles
            </p>
            <h1
              className="sf-display sf-balance text-4xl font-medium leading-[1.06] sm:text-5xl"
              style={{ color: "var(--sf-ink)" }}
            >
              Every category, one beautiful shelf
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed sm:text-base"
              style={{ color: "var(--sf-ink-soft)" }}
            >
              Browse by what you came for — every count below is live stock, not
              a promise.
            </p>
          </div>
        </Reveal>

        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="sf-shimmer aspect-[4/3] rounded-3xl" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState
            title="The shelves are being stocked"
            body="Categories appear automatically as products are published. Check back shortly."
            action={<SolidButton to="/">Back to home</SolidButton>}
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category, index) => (
              <Reveal key={category.slug} delay={Math.min(index * 0.06, 0.3)}>
                <Link
                  to={`/products?cat=${category.slug}`}
                  className={`group relative block overflow-hidden rounded-3xl ${
                    index === 0 ? "sm:col-span-2 lg:col-span-2" : ""
                  }`}
                  style={{ background: "var(--sf-dark-soft)" }}
                >
                  <div className={index === 0 ? "aspect-[2/1]" : "aspect-[4/3]"}>
                    <div className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]">
                      <OptimizedImage
                        src={category.coverImage}
                        alt={category.label}
                        preset="large"
                        priority={index < 3}
                        className="h-full w-full object-cover"
                        fallbackClassName="h-full w-full"
                      />
                    </div>
                  </div>
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, rgba(10,9,7,0.85) 0%, rgba(10,9,7,0.2) 55%, transparent 100%)",
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-6 sm:p-7">
                    <div>
                      <h2
                        className="sf-display text-2xl font-medium"
                        style={{ color: "var(--sf-dark-ink)" }}
                      >
                        {category.label}
                      </h2>
                      <p
                        className="mt-1 text-[13.5px]"
                        style={{ color: "var(--sf-dark-ink-soft)" }}
                      >
                        {category.tagline}
                      </p>
                      <p
                        className="mt-2 text-[12.5px] font-semibold"
                        style={{ color: "var(--sf-gold)" }}
                      >
                        {category.inStockCount} in stock
                      </p>
                    </div>
                    <span
                      className="sf-glass-dark flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-1"
                      style={{ color: "var(--sf-dark-ink)" }}
                    >
                      <ArrowRight className="h-5 w-5" />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
