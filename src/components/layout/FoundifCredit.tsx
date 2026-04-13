import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Phone, Mail, MessageCircle, Globe } from 'lucide-react';
import foundifLogo from '@/assets/foundif-logo.png';

export function FoundifCredit() {
  const [open, setOpen] = useState(false);

  const links = [
    { icon: Phone, label: 'Call Now', value: '9363200237', href: 'tel:+919363200237' },
    { icon: Mail, label: 'Email', value: 'find@foundif.com', href: 'mailto:find@foundif.com' },
    { icon: MessageCircle, label: 'WhatsApp', value: '9363200237', href: 'https://wa.me/919363200237' },
    { icon: Globe, label: 'Website', value: 'foundif.com', href: 'https://foundif.com' },
  ];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-ivory/30 text-xs hover:text-primary/60 transition-colors"
      >
        Crafted by <span className="font-bold text-primary/50 hover:text-primary transition-colors">Foundif Innovations</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-rich-black border-primary/20 text-ivory max-w-sm">
          <DialogHeader className="items-center">
            <img src={foundifLogo} alt="Foundif" className="h-10 mb-2" />
            <DialogTitle className="font-bold text-primary text-xl">Foundif Innovations</DialogTitle>
            <p className="text-ivory/50 text-sm">Digital Solutions & Web Development</p>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {links.map(({ icon: Icon, label, value, href }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-center gap-3 p-3 rounded-lg border border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all group"
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-ivory/40">{label}</p>
                  <p className="text-sm text-ivory/80 font-medium">{value}</p>
                </div>
              </a>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
