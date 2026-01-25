import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Facebook, Instagram, Twitter, Youtube } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const collections = [
  { name: 'Necklaces', href: '/collections/necklaces' },
  { name: 'Earrings', href: '/collections/earrings' },
  { name: 'Rings', href: '/collections/rings' },
  { name: 'Bangles', href: '/collections/bangles' },
  { name: 'Wedding Sets', href: '/collections/wedding-bridal' },
  { name: 'Diamond', href: '/collections/diamond-jewellery' },
];

const quickLinks = [
  { name: 'About Us', href: '/about' },
  { name: 'Store Locator', href: '/stores' },
  { name: 'Gold Rate', href: '/gold-rate' },
  { name: 'Contact', href: '/contact' },
  { name: 'My Account', href: '/account' },
  { name: 'Track Order', href: '/orders' },
];

const policies = [
  { name: 'Privacy Policy', href: '/privacy' },
  { name: 'Terms & Conditions', href: '/terms' },
  { name: 'Shipping Policy', href: '/shipping' },
  { name: 'Return Policy', href: '/returns' },
  { name: 'FAQ', href: '/faq' },
];

export function Footer() {
  return (
    <footer className="bg-rich-black text-ivory">
      {/* Newsletter Section */}
      <div className="border-b border-charcoal">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="font-serif text-3xl mb-2">Stay Connected</h3>
            <p className="text-ivory/60 mb-6">
              Subscribe to receive updates on new collections, exclusive offers, and gold rate alerts.
            </p>
            <form className="flex gap-3 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="Enter your email"
                className="bg-charcoal border-charcoal text-ivory placeholder:text-ivory/40 focus:border-primary"
              />
              <Button className="btn-premium px-8 whitespace-nowrap">
                Subscribe
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center">
                  <span className="text-rich-black font-serif font-bold text-xl">J</span>
                </div>
                <div>
                  <h2 className="font-serif text-2xl font-semibold">
                    <span className="text-gold-gradient">Heritage</span> Jewels
                  </h2>
                  <p className="text-xs text-ivory/50 tracking-widest uppercase">Since 1960</p>
                </div>
              </div>
            </Link>
            <p className="text-ivory/60 mb-6 max-w-sm">
              Crafting timeless elegance for over six decades. Every piece tells a story of tradition,
              craftsmanship, and uncompromising quality.
            </p>
            <div className="space-y-3 text-ivory/60">
              <a href="tel:+911234567890" className="flex items-center gap-3 hover:text-primary transition-colors">
                <Phone className="w-4 h-4" />
                <span>+91 123 456 7890</span>
              </a>
              <a href="mailto:info@heritagejewels.com" className="flex items-center gap-3 hover:text-primary transition-colors">
                <Mail className="w-4 h-4" />
                <span>info@heritagejewels.com</span>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>123 Jewellery Lane, T Nagar,<br />Chennai, Tamil Nadu 600017</span>
              </div>
            </div>
          </div>

          {/* Collections */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-gold-light">Collections</h4>
            <ul className="space-y-3">
              {collections.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-ivory/60 hover:text-primary transition-colors link-elegant"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-gold-light">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-ivory/60 hover:text-primary transition-colors link-elegant"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h4 className="font-serif text-lg font-semibold mb-6 text-gold-light">Policies</h4>
            <ul className="space-y-3">
              {policies.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className="text-ivory/60 hover:text-primary transition-colors link-elegant"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-charcoal">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-ivory/40 text-sm">
              © {new Date().getFullYear()} Heritage Jewels. All rights reserved.
            </p>
            
            {/* Social Links */}
            <div className="flex items-center gap-4">
              <a href="#" className="text-ivory/40 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-ivory/40 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-ivory/40 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-ivory/40 hover:text-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>

            {/* Trust Badges */}
            <div className="flex items-center gap-4 text-xs text-ivory/40">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                BIS Hallmarked
              </span>
              <span>|</span>
              <span>100% Certified</span>
              <span>|</span>
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
