import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, ExternalLink, ShieldCheck } from 'lucide-react';
import { FoundifCredit } from './FoundifCredit';

const collections = [
  { name: 'Necklaces', href: '/collections/necklaces' },
  { name: 'Earrings', href: '/collections/earrings' },
  { name: 'Rings', href: '/collections/rings' },
  { name: 'Bangles', href: '/collections/bangles' },
  { name: 'Wedding Sets', href: '/collections/wedding-sets' },
  { name: 'Diamond', href: '/collections/diamond-jewellery' },
];

const quickLinks = [
  { name: 'About Us', href: '/about' },
  { name: 'Store Locator', href: '/stores' },
  { name: 'Gold Rate', href: '/gold-rate' },
  { name: 'Journal / Blog', href: '/blog' },
  { name: 'Contact', href: '/contact' },
  { name: 'Track Order', href: '/track-order' },
];

const policies = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms & Conditions', href: '/terms' },
  { name: 'Shipping Policy', href: '/shipping' },
  { name: 'Return Policy', href: '/returns' },
  { name: 'FAQ', href: '/faq' },
];

const trustBadges = [
  { name: "BIS Hallmarked Gold", desc: "Certified purity" },
  { name: "IGI Certified Diamonds", desc: "Grading assurance" },
  { name: "GIA Certified Diamonds", desc: "Global standards" },
  { name: "Secure SSL Checkout", desc: "Safe payments" },
  { name: "Verified Payments", desc: "Razorpay / PayU" },
];

export function Footer() {

  const mapLink = 'https://share.google/zO9ki4MnpiMeXdNiT';

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
              Crafting timeless elegance for over three decades. Every piece tells a story of tradition, craftsmanship, and uncompromising quality in 916 BIS Hallmarked gold jewellery.
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

              {/* ✅ FIXED ADDRESS CLICKABLE */}
              <a
                href="https://share.google/zO9ki4MnpiMeXdNiT"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:text-primary transition-colors cursor-pointer"
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

      {/* MAP SECTION (UNCHANGED) */}
      <div className="border-t border-charcoal/50">
        <div className="container mx-auto px-4 py-12">
          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden border border-gold-light/30"
          >
            <div className="h-[280px] bg-[#14100e] flex items-center justify-center">
              <MapPin className="w-10 h-10 text-[#cca352]" />
              <span className="ml-2 text-[#cca352]">Open Google Maps</span>
            </div>
          </a>
        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-charcoal">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">

          <p className="text-ivory/40 text-sm">
            © 2026 KRT JEWELLERS. All rights reserved.
          </p>

          <div className="flex gap-4">
            <a href="https://instagram.com/krtjewellers" className="hover:text-primary">
              <Instagram />
            </a>
            <a href="https://facebook.com/krtjewellers" className="hover:text-primary">
              <Facebook />
            </a>
          </div>

        </div>
      </div>

    </footer>
  );
}
