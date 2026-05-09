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
  title = "Hassan Bookshop by Horumar - Your Trusted Educational Partner",
  description = "Hassan Bookshop by Horumar - Premium quality textbooks, authentic stationery, and verified electronics in Eastleigh, Nairobi. Trusted educational partner for students and professionals. Shop online with secure checkout and reliable delivery.",
  keywords = "Hassan Bookshop, Horumar, trusted bookstore Kenya, verified books Nairobi, Eastleigh bookshop, premium textbooks, quality stationery, authentic electronics, school supplies Kenya",
  image = "/og-image.jpg",
  url,
  type = "website",
}: SEOProps) {
  const location = useLocation();
  const fullUrl =
    url || `https://hassan.horumarin.com${location?.pathname || ""}`;

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
      { property: "og:site_name", content: "Hassan Bookshop by Horumar" },

      // Twitter Card
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },

      // Additional SEO
      { name: "robots", content: "index, follow" },
      { name: "language", content: "English" },
      { name: "author", content: "Hassan Bookshop by Horumar" },
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
