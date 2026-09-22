import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Cookie, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'krt_cookie_consent';

export function CookieConsent() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(STORAGE_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setIsOpen(false);
  };

  const handleDecline = () => {
    localStorage.setItem(STORAGE_KEY, 'essential_only');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-rich-black/95 text-ivory backdrop-blur-md border border-gold/30 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary shrink-0 mt-0.5">
            <Cookie className="w-5 h-5" />
          </div>
          <div className="flex-1 text-xs text-ivory/80 leading-relaxed">
            <p className="font-semibold text-ivory text-sm mb-1">We value your privacy</p>
            We use cookies to analyze site traffic, improve your shopping experience, and deliver personalized jewellery recommendations. Read our{' '}
            <Link to="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>.
          </div>
          <button
            onClick={handleDecline}
            aria-label="Close cookie banner"
            className="text-ivory/50 hover:text-ivory transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 justify-end pt-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDecline}
            className="text-xs text-ivory/70 hover:text-ivory hover:bg-white/10 h-8"
          >
            Essential Only
          </Button>
          <Button
            size="sm"
            onClick={handleAccept}
            className="btn-luxury text-xs h-8 px-4 font-medium"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  );
}
