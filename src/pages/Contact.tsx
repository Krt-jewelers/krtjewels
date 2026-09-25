import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, Mail, MapPin, Clock, MessageCircle, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

  

export default function ContactPage() {
  const [honeypot, setHoneypot] = useState('');
  const [lastSubmitted, setLastSubmitted] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Bot Honeypot Check (Silently drop spam)
    if (honeypot.trim().length > 0) {
      toast({ title: 'Message sent!', description: 'We will get back to you within 24 hours.' });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      return;
    }

    // 2. Cooldown check (prevent repeated rapid spam)
    const now = Date.now();
    if (now - lastSubmitted < 15000) {
      toast({
        title: 'Please wait',
        description: 'You sent a message recently. Please wait a few seconds before trying again.',
        variant: 'destructive',
      });
      return;
    }

    // 3. Indian Phone number validation
    const cleanedPhone = formData.phone.replace(/[\s\-+]/g, '').replace(/^91/, '');
    if (cleanedPhone && !/^[6-9]\d{9}$/.test(cleanedPhone)) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit Indian mobile number.',
        variant: 'destructive',
      });
      return;
    }

    // 4. Basic Email regex check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('enquiries').insert({
        user_id: user?.id || null,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });

      if (error) throw error;

      setLastSubmitted(Date.now());
      toast({
        title: 'Message sent!',
        description: 'We will get back to you within 24 hours.',
      });

      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      toast({
        title: 'Failed to send message',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-16 bg-gradient-to-r from-rich-black via-charcoal to-rich-black">
        <div className="container mx-auto px-4 text-center">
          <span className="text-gold-light text-sm uppercase tracking-[0.3em]">Get in Touch</span>
          <h1 className="font-serif text-4xl md:text-5xl text-ivory font-semibold mt-2 mb-4">
            Contact Us
          </h1>
          <p className="text-ivory/60 max-w-2xl mx-auto">
            Have questions about our collections? Need help with an order? 
            Our team is here to assist you.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="space-y-6">
              <Card className="card-luxury">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Phone className="w-5 h-5 text-primary" />
                    Call Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <a href="tel:+919843010986" className="text-lg hover:text-primary transition-colors">
                    +91 98430 10986
                  </a>
                  <p className="text-sm text-muted-foreground mt-1">Mon-Sun, 10AM-9PM</p>
                </CardContent>
              </Card>

              <Card className="card-luxury">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary" />
                    Email Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                                    <a href="mailto:krtjewellers1990@gmail.com" className="text-lg hover:text-primary transition-colors">
                    krtjewellers1990@gmail.com
                  </a>

                  <p className="text-sm text-muted-foreground mt-1">We reply within 24 hours</p>
                </CardContent>
              </Card>

              <Card className="card-luxury">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    Visit Us
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    1154, Big Bazaar St, Prakasam,<br />
                    Town Hall, Coimbatore,<br />
                    Tamil Nadu 641001
                  </p>
                </CardContent>
              </Card>

              <Card className="card-luxury">
                <CardHeader className="pb-2">
                  <CardTitle className="font-serif flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Store Hours
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Monday - Sunday<br />
                    10:00 AM - 9:00 PM
                  </p>
                </CardContent>
              </Card>

              {/* WhatsApp CTA */}
              <Button
                onClick={() => window.open('https://wa.me/919843010986', '_blank')}
                className="w-full py-6 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
              >
                <MessageCircle className="w-5 h-5" />
                Chat on WhatsApp
              </Button>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-luxury">
                <CardHeader>
                  <CardTitle className="font-serif text-2xl">Send us a Message</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          className="input-luxury"
                          placeholder="Your name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          className="input-luxury"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone *</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          required
                          className="input-luxury"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="input-luxury"
                          placeholder="What is this about?"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        className="input-luxury min-h-[150px]"
                        placeholder="Tell us how we can help you..."
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-premium w-full py-6 gap-2"
                    >
                      <Send className="w-4 h-4" />
                      {isSubmitting ? 'Sending...' : 'Send Message'}
                    </Button>

                        {/* Hidden Honeypot field for bot protection */}
    <div className="hidden" aria-hidden="true">
      <label htmlFor="website_url">Do not fill this</label>
      <input
        type="text"
        id="website_url"
        name="website_url"
        tabIndex={-1}
        autoComplete="off"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
      />
    </div>

                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
