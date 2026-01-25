import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppButtonProps {
  phoneNumber?: string;
  message?: string;
}

export function WhatsAppButton({ 
  phoneNumber = '911234567890',
  message = 'Hello! I would like to inquire about your jewellery collection.'
}: WhatsAppButtonProps) {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-luxury bg-[#25D366] hover:bg-[#20BD5A] text-white p-0 transition-all hover:scale-110"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="w-7 h-7" />
    </Button>
  );
}
