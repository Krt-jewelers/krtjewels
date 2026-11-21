import type { ProductCategory } from '@/lib/types';

// URL slug for each product category under /collections/. Wedding sets live
// at /collections/wedding-bridal (the megamenu and admin data use that slug).
const CATEGORY_SLUGS: Record<ProductCategory, string> = {
  necklaces: 'necklaces',
  earrings: 'earrings',
  rings: 'rings',
  bangles: 'bangles',
  bracelets: 'bracelets',
  chains: 'chains',
  pendants: 'pendants',
  wedding_sets: 'wedding-bridal',
  diamond_jewellery: 'diamond-jewellery',
  mens_jewellery: 'mens-jewellery',
};

// Older links used these; they still open the right collection.
const SLUG_ALIASES: Record<string, ProductCategory> = {
  'wedding-sets': 'wedding_sets',
};

export function collectionSlug(category: string): string {
  return CATEGORY_SLUGS[category as ProductCategory] || category.replace(/_/g, '-');
}

export function collectionPath(category: string): string {
  return `/collections/${collectionSlug(category)}`;
}

export function categoryFromSlug(slug: string | undefined): ProductCategory | undefined {
  if (!slug) return undefined;
  const key = slug.toLowerCase();
  const direct = (Object.keys(CATEGORY_SLUGS) as ProductCategory[]).find((c) => CATEGORY_SLUGS[c] === key);
  return direct || SLUG_ALIASES[key];
}
