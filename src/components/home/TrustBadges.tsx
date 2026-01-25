import { Shield, Award, Truck, Gem } from 'lucide-react';

const features = [
  {
    icon: Shield,
    title: 'BIS Hallmarked',
    description: 'Every piece certified for purity by the Bureau of Indian Standards.',
  },
  {
    icon: Gem,
    title: 'Certified Diamonds',
    description: 'GIA and IGI certified diamonds with complete documentation.',
  },
  {
    icon: Award,
    title: '60+ Years Legacy',
    description: 'Trusted by generations of families for their precious moments.',
  },
  {
    icon: Truck,
    title: 'Insured Delivery',
    description: 'Free insured shipping across India with secure packaging.',
  },
];

export function TrustBadges() {
  return (
    <section className="py-16 bg-rich-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {features.map((feature) => (
            <div key={feature.title} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold transition-transform group-hover:scale-110">
                <feature.icon className="w-8 h-8 text-rich-black" />
              </div>
              <h3 className="font-serif text-lg text-ivory font-semibold mb-2">
                {feature.title}
              </h3>
              <p className="text-ivory/60 text-sm">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
