import { Link } from 'react-router-dom';
import {
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
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
  { name: "Verified Payments", desc: "UPI Safe Payments" },
];

export function Footer() {

  // FIXED MAP LINK (works properly in Google Maps)
  const mapLink =
    'https://www.google.com/maps?q=1154+Big+Bazaar+St+Prakasam+Town+Hall+Coimbatore+Tamil+Nadu+641001';

  return (
    <footer className="bg-rich-black text-ivory">

      {/* TRUST BADGE STRIP (RESTORED) */}
      <div className="border-b border-charcoal/50">
        <div className="container mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-5 gap-4 text-center">

          {trustBadges.map((b) => (
            <div
              key={b.name}
              className="p-3 border border-gold-light/20 rounded-lg bg-black/20"
            >
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
              Crafting timeless elegance for over three decades. Every piece tells a story of tradition,
              craftsmanship, and uncompromising quality in 916 BIS Hallmarked gold jewellery.
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

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1" />
                <span>
                  1154, Big Bazaar St, Prakasam,<br />
                  Town Hall, Coimbatore,<br />
                  Tamil Nadu 641001
                </span>
              </div>

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

      {/* MAP SECTION (UNCHANGED UI + FIXED LINK ONLY) */}
      <div className="relative overflow-hidden border-t border-charcoal/50">
        <div className="container mx-auto px-4 py-12">

          <div className="rounded-3xl border border-primary/60 bg-gradient-to-br from-rich-black via-rich-black/80 to-black/90 p-2 md:p-3 shadow-[0_0_25px_rgba(212,175,55,0.25)]">

            <a
              href={mapLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open KRT Jewellers location in Google Maps"
              className="relative block w-full overflow-hidden rounded-2xl border border-gold-light/30 shadow-2xl group transition-all duration-500 hover:border-gold-light/80"
            >

              <div className="w-full h-[260px] md:h-[320px] bg-[#14100e] relative flex items-center justify-center">

                <svg
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500"
                  viewBox="0 0 1000 400"
                  preserveAspectRatio="xMidYMid slice"
                >
                  <g stroke="#cca352" strokeWidth="1.5" fill="none" opacity="0.4">
                    <path d="M-100,250 C200,240 500,280 1100,200" />
                    <path d="M-100,150 C300,160 600,120 1100,180" />
                    <path d="M300,-50 C320,100 280,300 350,450" />
                    <path d="M700,-50 C680,150 720,250 650,450" />
                    <path d="M480,-50 L520,450" strokeWidth="2.5" opacity="0.6" />
                  </g>
                </svg>

                <div className="absolute z-10 flex flex-col items-center">
                  <div className="w-12 h-12 bg-[#cca352] rotate-45 flex items-center justify-center">
                    <span className="text-[#1a1512] font-bold text-lg -rotate-45">KRT</span>
                  </div>
                </div>

              </div>

              <div className="absolute inset-0 bg-[#1a1512]/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-[#cca352] mx-auto mb-3" />
                  <p className="text-[#cca352]">Get Directions</p>
                  <div className="flex items-center justify-center gap-2 text-white/60 text-sm mt-2">
                    Open in Google Maps <ExternalLink size={14} />
                  </div>
                </div>
              </div>

            </a>

          </div>

        </div>
      </div>

      {/* BOTTOM BAR */}
      <div className="border-t border-charcoal">
        <div className="container mx-auto px-4 py-6 flex justify-between items-center">

          <p className="text-ivory/40 text-sm">
            © {new Date().getFullYear()} KRT JEWELLERS. All rights reserved.
          </p>

          <FoundifCredit />

          <div className="flex gap-4">
            <a href="https://www.facebook.com" className="hover:text-primary">
              <Facebook />
            </a>
            <a href="https://www.instagram.com" className="hover:text-primary">
              <Instagram />
            </a>
          </div>

        </div>
      </div>

    </footer>
  );
}
