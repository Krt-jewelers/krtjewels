/**
 * Cloudinary image URL optimizer.
 * Injects f_auto,q_auto,c_fill,w_,h_ transformations after `/upload/`.
 * Returns the original URL untouched for non-Cloudinary sources.
 */
export interface CldOpts {
  w?: number;
  h?: number;
  quality?: 'auto' | number;
  crop?: 'fill' | 'fit' | 'limit' | 'scale';
  dpr?: 'auto' | number;
}

export function cld(url: string | null | undefined, opts: CldOpts = {}): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) return url;

  const { w, h, quality = 'auto', crop = 'fill', dpr = 'auto' } = opts;
  const parts = ['f_auto', `q_${quality}`, `dpr_${dpr}`];
  if (w) parts.push(`w_${w}`);
  if (h) parts.push(`h_${h}`);
  if (w || h) parts.push(`c_${crop}`);

  // Avoid double-injection if a transformation block already exists right after /upload/
  return url.replace(/\/upload\/(?!.*\/upload\/)/, `/upload/${parts.join(',')}/`);
}

/** Build a srcset string at 1x and 2x widths. */
export function cldSrcSet(url: string | null | undefined, widths: number[], h?: number): string {
  if (!url) return '';
  return widths
    .map((w) => `${cld(url, { w, h: h ? Math.round((h * w) / widths[0]) : undefined })} ${w}w`)
    .join(', ');
}
