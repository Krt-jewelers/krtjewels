import { Link } from "react-router-dom";
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
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

// TRUST BADGES
const trustBadges = [
  {
    name: "BIS Hallmarked Gold",
    desc: "Certified purity assurance",
  },
  {
    name: "IGI Certified Diamonds",
    desc: "International grading standard",
  },
  {
    name: "GIA Certified Diamonds",
    desc: "Global diamond authentication",
  },
  {
    name: "Secure SSL Checkout",
    desc: "Encrypted transactions",
  },
  {
    name: "Razorpay / PayU Verified",
    desc: "Trusted payment gateways",
  },
];

export function Footer() {
  // FIXED GOOGLE MY BUSINESS LINK (your link)
  const mapLink = "https://share.google/zO9ki4MnpiMeXdNiT";

  return (
    <footer className="bg-rich-black text-ivory">

      {/* TRUST BADGE STRIP */}
      <div className="border-b border-charcoal/50">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {trustBadges.map((badge) => (
              <div
                key={badge.name}
                className="flex flex-col items-center justify-center p-3 rounded-lg border border-gold/20 bg-black/20"
              >
                <ShieldCheck className="w-5 h-5 text-primary mb-1" />
                <p className="text-xs font-medium text-primary">{badge.name}</p>
                <p className="text-[10px] text-ivory/50">{badge.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN FOOTER */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">

          {/* BRAND */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <h2 className="text-2xl font-medium text-primary">
                KRT JEWELLERS
              </h2>
              <p className="text-xs text-ivory/50 tracking-widest uppercase mt-1">
                Trusted Since 30+ Years
              </p>
            </Link>

            <p className="text-ivory/60 mb-6 max-w-sm">
              Crafting timeless elegance with certified gold & diamond jewellery,
              built on trust, purity, and craftsmanship.
            </p>

            <div className="space-y-3 text-ivory/60">
              <a href="tel:+919843010986" className="flex items-center gap-3 hover:text-primary">
                <Phone className="w-4 h-4" />
                <span>+91 98430 10986</span>
              </a>

              <a href="mailto:info@krtjewels.com" className="flex items-center gap-3 hover:text-primary">
                <Mail className="w-4 h-4" />
                <span>info@krtjewels.com</span>
              </a>

              {/* ADDRESS LINK FIXED TO GMB */}
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:text-primary"
              >
                <MapPin className="w-4 h-4 mt-1" />
                <span>
                  1154, Big Bazaar St, Prakasam,<br />
                  Town Hall, Coimbatore,<br />
                  Tamil Nadu 641001
                </span>
              </a>
            </div>
          </div>

          {/* COLLECTIONS */}
          <div>
            <h4 className="text-gold-light mb-6">Collections</h4>
            <ul className="space-y-3">
              {collections.map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-ivory/60 hover:text-primary">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* QUICK LINKS */}
          <div>
            <h4 className="text-gold-light mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-ivory/60 hover:text-primary">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* POLICIES */}
          <div>
            <h4 className="text-gold-light mb-6">Policies</h4>
            <ul className="space-y-3">
              {policies.map((item) => (
                <li key={item.name}>
                  <Link to={item.href} className="text-ivory/60 hover:text-primary">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-charcoal">
        <div className="container mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">

          <p className="text-ivory/40 text-sm">
            © {new Date().getFullYear()} KRT JEWELLERS
          </p>

          <FoundifCredit />

          <div className="flex gap-4">
            <a href="#" className="hover:text-primary"><Facebook /></a>
            <a href="https://www.instagram.com/krtjewellers/" className="hover:text-primary"><Instagram /></a>
            <a href="#" className="hover:text-primary"><Twitter /></a>
            <a href="#" className="hover:text-primary"><Youtube /></a>
          </div>
        </div>
      </div>

    </footer>
  );
}
