import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, ExternalLink } from 'lucide-react';
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

export function Footer() {

  const mapLink = "https://share.google/zO9ki4MnpiMeXdNiT";

  return (
    <footer className="bg-rich-black text-ivory">

      {/* TRUST BADGE STRIP */}
      <div className="border-b border-charcoal/50 py-4">
        <div className="container mx-auto px-4 flex flex-wrap gap-6 justify-center text-xs text-ivory/60">
          <span>✔ BIS Hallmarked Gold</span>
          <span>✔ IGI Certified Diamonds</span>
          <span>✔ GIA Graded Stones</span>
          <span>✔ Secure SSL Checkout</span>
          <span>✔ Razorpay Verified</span>
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

            <p className="text-ivory/60 mb-6 max-w-sm leading-relaxed">
              Crafted with timeless elegance over three decades. Every piece reflects tradition,
              craftsmanship, and uncompromising excellence in 916 BIS Hallmarked gold jewellery.
              <br /><br />
              © 2026 KRT JEWELLERS. All rights reserved.
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

              {/* CLICKABLE ADDRESS */}
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
            <h4 className="font-serif text-lg mb-6 text-gold-light">Collections</h4>
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
            <h4 className="font-serif text-lg mb-6 text-gold-light">Quick Links</h4>
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
            <h4 className="font-serif text-lg mb-6 text-gold-light">Policies</h4>
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

      {/* MAP SECTION (FULL RESTORED YOUR STYLE) */}
      <div className="relative overflow-hidden border-t border-charcoal/50">
        <div className="container mx-auto px-4 py-12">

          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="relative block w-full overflow-hidden rounded-2xl border border-gold-light/30 group"
          >
            <div className="w-full h-[320px] bg-[#14100e] flex items-center justify-center">

              {/* YOUR ORIGINAL MAP STYLE */}
              <svg
                className="absolute inset-0 w-full h-full opacity-80 group-hover:opacity-100 transition"
                viewBox="0 0 1000 400"
              >
                <g stroke="#cca352" strokeWidth="1.5" fill="none" opacity="0.4">
                  <path d="M-100,250 C200,240 500,280 1100,200" />
                  <path d="M-100,150 C300,160 600,120 1100,180" />
                  <path d="M300,-50 C320,100 280,300 350,450" />
                  <path d="M700,-50 C680,150 720,250 650,450" />
                </g>
              </svg>

              <div className="z-10 text-center text-gold-light">
                <MapPin className="mx-auto mb-2" />
                <p>Click to open Google Maps</p>
              </div>

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

          <FoundifCredit />

          {/* SOCIALS (ONLY INSTAGRAM + FACEBOOK) */}
          <div className="flex gap-4">
            <a href="https://www.instagram.com/krtjewellers/" target="_blank">
              <Instagram className="w-5 h-5" />
            </a>
            <a href="https://facebook.com/krtjewels" target="_blank">
              <Facebook className="w-5 h-5" />
            </a>
          </div>

        </div>
      </div>

    </footer>
  );
}
