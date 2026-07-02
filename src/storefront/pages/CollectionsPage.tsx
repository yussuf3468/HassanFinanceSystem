import { useMemo } from "react";
import { ArrowRight, BadgePercent } from "lucide-react";
import OptimizedImage from "../../components/OptimizedImage";
import ProductCard from "../components/ProductCard";
import {
  Container,
  EmptyState,
  ProductGridSkeleton,
  Reveal,
  SolidButton,
} from "../components/ui";
import { storeConfig } from "../config/store";
import { productsForCollection, useCatalog } from "../lib/catalog";
import { Link, useRoute } from "../lib/router";

/* ═══════════════════════════════════════════════════════════════
   COLLECTIONS & OFFERS — rule-driven edits of the catalog.
   /collections        → index of all edits
   /collections/:slug  → a single edit, as a product grid
   /offers             → offer-flagged collections + the big promo
   ═══════════════════════════════════════════════════════════════ */

export default function CollectionsPage({ offersOnly = false }: { offersOnly?: boolean }) {
  const route = useRoute();
  const slug = !offersOnly ? route.segments[1] : undefined;

  if (slug) return <CollectionDetail slug={slug} />;
  return <CollectionsIndex offersOnly={offersOnly} />;
}

function CollectionsIndex({ offersOnly }: { offersOnly: boolean }) {
  const { products, isLoading } = useCatalog();
  const collections = offersOnly
    ? storeConfig.collections.filter((c) => c.isOffer)
    : storeConfig.collections;

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <Container>
        <Reveal>
          <div className="mb-10 max-w-2xl sm:mb-14">
            <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-gold)" }}>
              {offersOnly ? "Deals worth the trip" : "Curated edits"}
            </p>
            <h1
              className="sf-display sf-balance text-4xl font-medium leading-[1.06] sm:text-5xl"
              style={{ color: "var(--sf-ink)" }}
            >
              {offersOnly ? "Special offers" : "Collections"}
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed sm:text-base"
              style={{ color: "var(--sf-ink-soft)" }}
            >
              {offersOnly
                ? "Smart ways to spend less — and the standing promise below."
                : "Shortcuts through the catalog, curated by people who know the stock."}
            </p>
          </div>
        </Reveal>

        {/* Standing offer banner on the offers page */}
        {offersOnly && (
          <Reveal>
            <div
              className="sf-grain relative mb-10 overflow-hidden rounded-[2rem] p-8 sm:p-12"
              style={{
                background:
                  "linear-gradient(125deg, var(--sf-accent-deep), var(--sf-accent))",
              }}
            >
              <div className="relative z-[2] flex flex-wrap items-center justify-between gap-6">
                <div className="max-w-xl">
                  <p className="sf-eyebrow mb-3 flex items-center gap-2" style={{ color: "var(--sf-gold)" }}>
                    <BadgePercent className="h-4 w-4" />
                    {storeConfig.offer.eyebrow}
                  </p>
                  <h2 className="sf-display text-3xl font-medium text-white sm:text-4xl">
                    {storeConfig.offer.title}
                  </h2>
                  <p className="mt-3 text-[15px]" style={{ color: "rgba(255,255,255,0.75)" }}>
                    {storeConfig.offer.body}
                  </p>
                </div>
                <Link
                  to="/products"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold transition-transform hover:scale-105"
                  style={{ color: "var(--sf-accent-deep)" }}
                >
                  {storeConfig.offer.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        )}

        {collections.length === 0 ? (
          <EmptyState
            title="No offers running right now"
            body="New deals drop regularly — subscribe to the newsletter and be first to know."
            action={<SolidButton to="/products">Shop the range</SolidButton>}
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2">
            {collections.map((collection, index) => {
              const items = productsForCollection(products, collection);
              const cover = items.find((p) => p.image_url)?.image_url;
              return (
                <Reveal key={collection.slug} delay={index * 0.07}>
                  <Link
                    to={`/collections/${collection.slug}`}
                    className="group relative block overflow-hidden rounded-3xl"
                    style={{ background: "var(--sf-dark-soft)" }}
                  >
                    <div className="aspect-[16/9]">
                      {cover ? (
                        <div className="h-full w-full transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]">
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
                          className="h-full w-full"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--sf-accent-deep), var(--sf-dark))",
                          }}
                        />
                      )}
                    </div>
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(10,9,7,0.85) 0%, rgba(10,9,7,0.25) 60%, transparent 100%)",
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                      <p className="sf-eyebrow mb-1.5" style={{ color: "var(--sf-gold)" }}>
                        {collection.tagline}
                      </p>
                      <h2
                        className="sf-display text-2xl font-medium"
                        style={{ color: "var(--sf-dark-ink)" }}
                      >
                        {collection.title}
                      </h2>
                      <p
                        className="mt-2 line-clamp-1 text-[13.5px]"
                        style={{ color: "var(--sf-dark-ink-soft)" }}
                      >
                        {collection.description}
                      </p>
                      <p
                        className="mt-3 flex items-center gap-2 text-[13.5px] font-semibold"
                        style={{ color: "var(--sf-dark-ink)" }}
                      >
                        {isLoading ? "Loading…" : `${items.length} products`}
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </p>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}

function CollectionDetail({ slug }: { slug: string }) {
  const { products, isLoading } = useCatalog();
  const collection = storeConfig.collections.find((c) => c.slug === slug);

  const items = useMemo(
    () => (collection ? productsForCollection(products, collection) : []),
    [products, collection],
  );

  if (!collection) {
    return (
      <div className="pt-24">
        <EmptyState
          title="Collection not found"
          body="This edit may have ended. Browse the current collections instead."
          action={<SolidButton to="/collections">All collections</SolidButton>}
        />
      </div>
    );
  }

  return (
    <div className="pb-16 pt-24 sm:pt-28">
      <Container>
        <Reveal>
          <div className="mb-10 max-w-2xl">
            <p className="sf-eyebrow mb-3" style={{ color: "var(--sf-gold)" }}>
              {collection.tagline}
            </p>
            <h1
              className="sf-display sf-balance text-4xl font-medium leading-[1.06] sm:text-5xl"
              style={{ color: "var(--sf-ink)" }}
            >
              {collection.title}
            </h1>
            <p
              className="mt-4 text-[15px] leading-relaxed sm:text-base"
              style={{ color: "var(--sf-ink-soft)" }}
            >
              {collection.description}
            </p>
          </div>
        </Reveal>

        {isLoading ? (
          <ProductGridSkeleton count={8} />
        ) : items.length === 0 ? (
          <EmptyState
            title="This edit is empty right now"
            body="Stock moves fast. Check the full range — new products land every week."
            action={<SolidButton to="/products">Browse all products</SolidButton>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {items.map((product, index) => (
              <Reveal key={product.id} delay={Math.min(index * 0.05, 0.25)}>
                <ProductCard product={product} priority={index < 4} />
              </Reveal>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}
