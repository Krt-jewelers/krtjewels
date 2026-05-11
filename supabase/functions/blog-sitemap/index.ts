// Public XML sitemap that always reflects the latest published blogs.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SITE_URL = (Deno.env.get("PUBLIC_SITE_URL") || "https://krtjewellers.com").replace(/\/+$/, "");

const STATIC_ROUTES: { path: string; changefreq: string; priority: string }[] = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/blog", changefreq: "daily", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/stores", changefreq: "monthly", priority: "0.5" },
  { path: "/track-order", changefreq: "monthly", priority: "0.4" },
  { path: "/gold-rate", changefreq: "daily", priority: "0.6" },
];

function xmlEscape(s: string) {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!,
  );

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, updated_at, published_at")
    .eq("is_published", true);

  const { data: products } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_active", true)
    .limit(2000);

  const urls: string[] = [];

  for (const r of STATIC_ROUTES) {
    urls.push(`<url><loc>${SITE_URL}${r.path}</loc><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`);
  }

  for (const p of posts || []) {
    const lastmod = (p.updated_at || p.published_at || "").slice(0, 10);
    urls.push(
      `<url><loc>${SITE_URL}/blog/${xmlEscape(p.slug)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    );
  }

  for (const p of products || []) {
    const lastmod = (p.updated_at || "").slice(0, 10);
    urls.push(
      `<url><loc>${SITE_URL}/product/${xmlEscape(p.slug)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ""}<changefreq>weekly</changefreq><priority>0.7</priority></url>`,
    );
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=300",
      "Access-Control-Allow-Origin": "*",
    },
  });
});
