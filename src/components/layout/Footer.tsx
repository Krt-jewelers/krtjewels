import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { FoundifCredit } from "./FoundifCredit";

const collections = [
  { name: "Necklaces", href: "/collections/necklaces" },
  { name: "Earrings", href: "/collections/earrings" },
  { name: "Rings", href: "/collections/rings" },
  { name: "Bangles", href: "/collections/bangles" },
  { name: "Wedding Sets", href: "/collections/wedding-sets" },
  { name: "Diamond", href: "/collections/diamond-jewellery" },
];

const quickLinks = [
  { name: "About Us", href: "/about" },
  { name: "Store Locator", href: "/stores" },
  { name: "Gold Rate", href: "/gold-rate" },
  { name: "Journal / Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
  { name: "Track Order", href: "/track-order" },
];

const policies = [
  { name: "Privacy Policy", href: "/privacy" },
  { name: "Terms & Conditions", href: "/terms" },
  { name: "Shipping Policy", href: "/shipping" },
  { name: "Return Policy", href: "/returns" },
  { name: "FAQ", href: "/faq" },
];

const trustBadges = [
  { name: "BIS Hallmarked Gold", desc: "Certified purity" },
  { name: "IGI Certified Diamonds", desc: "Grading assurance" },
  { name: "GIA Certified Diamonds", desc: "Global standards" },
  { name: "Secure SSL Checkout", desc: "Safe payments" },
  { name: "Verified Payments", desc: "Razorpay / PayU" },
];

export function Footer() {
  const mapLink = "https://share.google/zO9ki4MnpiMeXdNiT";

  return (
    <footer className="bg-rich-black text-ivory">

      {/* TRUST STRIP */}
      <div className="border-b border-charcoal/50">
        <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {trustBadges.map((b) => (
            <div key={b.name} className="p-3 border border-gold/20 rounded-lg bg-black/20">
              <ShieldCheck className="w-5 h-5 text-primary mx-auto mb-1" />
              <p className="text-xs font-medium text-primary">{b.name}</p>
              <p className="text-[10px] text-ivory/50">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* MAIN FOOTER */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* BRAND */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <h2 className="font-serif text-2xl font-medium text-primary">
                KRT JEWELLERS
              </h2>
              <p className="text-xs text-ivory/50 tracking-widest uppercase mt-1">
                Trusted Since 30+ Years
              </p>
            </Link>

            <p className="text-ivory/60 mb-6 max-w-sm">
              Crafting timeless elegance with purity, tradition, and certified jewellery craftsmanship.
            </p>

            <div className="space-y-3 text-ivory/60">

              <a href="tel:+919843010986" className="flex items-center gap-3 hover:text-primary">
                <Phone className="w-4 h-4" />
                <span>+91 98430 10986</span>
              </a>

              <a href="mailto:krtjewellers1990@gmail.com" className="flex items-center gap-3 hover:text-primary">
                <Mail className="w-4 h-4" />
                <span>krtjewellers1990@gmail.com</span>
              </a>

            </div>
          </div>

          {/* COLLECTIONS */}
          <div>
            <h4 className="text-gold-light mb-6">Collections</h4>
            <ul className="space-y-3">
              {collections.map((i) => (
                <li key={i.name}>
                  <Link to={i.href} className="text-ivory/60 hover:text-primary">
                    {i.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="text-gold-light mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((i) => (
                <li key={i.name}>
                  <Link to={i.href} className="text-ivory/60 hover:text-primary">
                    {i.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* POLICIES */}
          <div>
            <h4 className="text-gold-light mb-6">Policies</h4>
            <ul className="space-y-3">
              {policies.map((i) => (
                <li key={i.name}>
                  <Link to={i.href} className="text-ivory/60 hover:text-primary">
                    {i.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* MAP SECTION (RESTORED FULL) */}
      <div className="border-t border-charcoal/50">
        <div className="container mx-auto px-4 py-12">

          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden border border-gold/30 relative group"
          >

            <div className="h-[260px] md:h-[320px] bg-[#14100e] flex items-center justify-center relative">

              <MapPin className="w-12 h-12 text-primary" />

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                <div className="text-center text-primary">
                  <p className="text-lg font-serif">Get Directions</p>
                  <div className="flex items-center justify-center gap-2 text-sm text-ivory/60">
                    Open in Google Maps <ExternalLink size={14} />
                  </div>
                </div>
              </div>

            </div>

          </a>

        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-charcoal">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">

          <p className="text-ivory/40 text-sm">
            © {new Date().getFullYear()} KRT JEWELLERS. All Rights Reserved.
          </p>

          <FoundifCredit />

          {/* SOCIAL (ONLY 2) */}
          <div className="flex gap-4">
            <a href="https://facebook.com/krtjewellers" className="hover:text-primary">
              <Facebook />
            </a>
            <a href="https://www.instagram.com/krtjewellers/" className="hover:text-primary">
              <Instagram />
            </a>
          </div>

        </div>
      </div>

    </footer>
  );
}
