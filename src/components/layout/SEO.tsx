import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  noindex?: boolean;
  schema?: Record<string, any> | Record<string, any>[];
}

const SITE_URL = 'https://www.krtjewellers.com';
const DEFAULT_TITLE = 'KRT Jewellers – Premium Gold & Diamond Jewellery Store';
const DEFAULT_DESC =
  'Shop premium handcrafted gold & diamond jewellery. Explore necklaces, rings, earrings, bangles, bridal sets & more. Trusted jewellers since generations.';
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

export function SEO({
  title,
  description = DEFAULT_DESC,
  path,
  image = DEFAULT_IMAGE,
  type = 'website',
  noindex = false,
  schema,
}: SEOProps) {
  const location = useLocation();
  const canonicalPath = path || location.pathname;
  const canonicalUrl = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath.replace(/\/+$/, '')}`;
  const fullTitle = title ? `${title} | KRT Jewellers` : DEFAULT_TITLE;

  useEffect(() => {
    // 1. Document title
    document.title = fullTitle;

    // Helper to create or update meta tags
    const setMeta = (attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    // 2. Standard Meta
    setMeta('name', 'description', description);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // 3. Dynamic Canonical Tag
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    // 4. Open Graph
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:type', type);

    // 5. Twitter Card
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:url', canonicalUrl);
    setMeta('name', 'twitter:image', image);

    // 6. Dynamic JSON-LD Structured Data
    let schemaScript = document.getElementById('route-schema');
    if (schema) {
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.id = 'route-schema';
        schemaScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schema);
    } else if (schemaScript) {
      schemaScript.remove();
    }

    return () => {
      const s = document.getElementById('route-schema');
      if (s) s.remove();
    };
  }, [fullTitle, description, canonicalUrl, image, type, noindex, schema]);

  return null;
}
