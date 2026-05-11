import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram } from 'lucide-react';
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
              Crafted with timeless elegance over three decades, each creation reflects heritage,
              masterful craftsmanship, and uncompromising excellence in 916 BIS Hallmarked gold jewellery.  
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
                className="flex items-start gap-3 hover:text-primary transition-colors"
              >
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
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

      {/* MAP SECTION */}
      <div className="border-t border-charcoal/50">
        <div className="container mx-auto px-4 py-10">

          <a
            href={mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl overflow-hidden border border-gold-light/40 hover:border-gold-light transition"
          >
            <div className="h-[260px] md:h-[320px] flex items-center justify-center bg-black text-gold-light">
              <div className="text-center">
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
