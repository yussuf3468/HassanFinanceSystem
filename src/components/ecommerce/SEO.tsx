import { useEffect } from "react";
import { useLocation } from "../../hooks/useLocation";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "product" | "article";
}

export default function SEO({
  title = "Horumar - Your Business, Your Progress",
  description = "Premium educational materials, stationery, and electronics in Eastleigh, Nairobi. Quality products for students and professionals. Shop online with fast delivery.",
  keywords = "bookstore, Kenya, Nairobi, Eastleigh, textbooks, stationery, electronics, school supplies, Horumar",
  image = "/og-image.jpg",
  url,
  type = "website",
}: SEOProps) {
  const location = useLocation();
  const fullUrl = url || `https://horumar.com${location?.pathname || ""}`;

  useEffect(() => {
    // Set document title
    document.title = title;

    // Set meta tags
    const metaTags = [
      { name: "description", content: description },
      { name: "keywords", content: keywords },

      // Open Graph
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:image", content: image },
      { property: "og:url", content: fullUrl },
      { property: "og:type", content: type },
      { property: "og:site_name", content: "Horumar" },

      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },

      // Additional SEO
      { name: "robots", content: "index, follow" },
      { name: "language", content: "English" },
      { name: "author", content: "Horumar" },
    ];

    metaTags.forEach(({ name, property, content }) => {
      const attribute = property ? "property" : "name";
      const value = property || name;

      if (!value) return;

      let element = document.querySelector(
        `meta[${attribute}="${value}"]`,
      ) as HTMLMetaElement;

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attribute, value);
        document.head.appendChild(element);
      }

      element.content = content;
    });

    // Set canonical URL
    let canonical = document.querySelector(
      'link[rel="canonical"]',
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = fullUrl;
  }, [title, description, keywords, image, fullUrl, type]);

  return null;
}
