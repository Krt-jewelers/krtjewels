import { Layout } from '@/components/layout/Layout';
import { Award, Users, Heart, Gem, Shield, Truck } from 'lucide-react';

export default function AboutPage() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1920&h=800&fit=crop"
            alt="Heritage Jewels"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-rich-black/70" />
        </div>
        <div className="container mx-auto px-4 relative text-center">
          <span className="text-gold-light text-sm uppercase tracking-[0.3em]">Our Story</span>
          <h1 className="font-serif text-4xl md:text-6xl text-ivory font-semibold mt-2 mb-6">
            Crafting Elegance Since 1960
          </h1>
          <p className="text-ivory/80 text-lg max-w-3xl mx-auto">
            For over six decades, Heritage Jewels has been at the forefront of Indian jewellery 
            craftsmanship, blending traditional artistry with contemporary designs.
          </p>
        </div>
      </section>

      {/* Our Legacy */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-primary text-sm uppercase tracking-[0.3em]">Our Legacy</span>
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mt-2 mb-6">
                A Heritage of Excellence
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  What began as a small workshop in Chennai in 1960 has grown into one of India's 
                  most trusted jewellery brands. Our founder, Shri. Raghunathan, envisioned a jewellery 
                  house that would honour traditional craftsmanship while embracing innovation.
                </p>
                <p>
                  Today, under the leadership of the third generation, we continue to uphold the 
                  values of quality, transparency, and customer trust that have defined our journey. 
                  Every piece that leaves our workshop carries the legacy of thousands of skilled 
                  artisans who have contributed to our story.
                </p>
                <p>
                  We take pride in being one of the pioneers in offering transparent pricing, 
                  where customers can see exactly how their jewellery is priced based on weight, 
                  making charges, and current gold rates.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-[4/5] rounded-xl overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1596944924616-7b38e7cfac36?w=800&h=1000&fit=crop"
                  alt="Heritage craftsmanship"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-primary text-primary-foreground p-6 rounded-xl shadow-luxury">
                <p className="font-serif text-4xl font-bold">60+</p>
                <p className="text-sm">Years of Legacy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="text-primary text-sm uppercase tracking-[0.3em]">Our Values</span>
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mt-2">
              What Sets Us Apart
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-card p-8 rounded-xl shadow-soft text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-gold flex items-center justify-center">
                <Gem className="w-8 h-8 text-rich-black" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Master Craftsmanship</h3>
              <p className="text-muted-foreground">
                Every piece is handcrafted by artisans with decades of experience, 
                using techniques passed down through generations.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-gold flex items-center justify-center">
                <Shield className="w-8 h-8 text-rich-black" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Certified Purity</h3>
              <p className="text-muted-foreground">
                All our gold jewellery is BIS hallmarked, and our diamonds are GIA/IGI certified 
                for guaranteed authenticity.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-gold flex items-center justify-center">
                <Heart className="w-8 h-8 text-rich-black" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Customer First</h3>
              <p className="text-muted-foreground">
                We believe in transparent pricing and exceptional service, ensuring every 
                customer feels valued and informed.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-gold flex items-center justify-center">
                <Award className="w-8 h-8 text-rich-black" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Award Winning</h3>
              <p className="text-muted-foreground">
                Recognized nationally for design excellence and ethical business practices 
                in the jewellery industry.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-gold flex items-center justify-center">
                <Users className="w-8 h-8 text-rich-black" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">1 Million+ Customers</h3>
              <p className="text-muted-foreground">
                Trusted by over a million families for their precious moments, 
                from weddings to celebrations.
              </p>
            </div>

            <div className="bg-card p-8 rounded-xl shadow-soft text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-gold flex items-center justify-center">
                <Truck className="w-8 h-8 text-rich-black" />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Pan India Delivery</h3>
              <p className="text-muted-foreground">
                Free insured delivery across India with secure packaging and 
                real-time tracking for peace of mind.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <span className="text-primary text-sm uppercase tracking-[0.3em]">Trust & Quality</span>
          <h2 className="font-serif text-3xl md:text-4xl font-semibold mt-2 mb-12">
            Our Certifications
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-12">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <span className="font-serif text-2xl font-bold">BIS</span>
              </div>
              <p className="font-medium">Hallmark Certified</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <span className="font-serif text-2xl font-bold">GIA</span>
              </div>
              <p className="font-medium">Diamond Certified</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <span className="font-serif text-2xl font-bold">IGI</span>
              </div>
              <p className="font-medium">Gemstone Certified</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <span className="font-serif text-2xl font-bold">ISO</span>
              </div>
              <p className="font-medium">Quality Assured</p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
