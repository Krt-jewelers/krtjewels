import { Gem, Sparkles, RefreshCw, Shield, Award, Truck, Heart, Clock } from 'lucide-react';

export function TrustPromise() {
  const promises = [
    {
      icon: Gem,
      title: 'Quality',
      description: 'Premium materials',
    },
    {
      icon: Sparkles,
      title: 'Cut',
      description: 'Expert craftsmanship',
    },
    {
      icon: Shield,
      title: 'Certified',
      description: 'BIS Hallmarked',
    },
    {
      icon: RefreshCw,
      title: 'Exchange',
      description: 'Lifetime exchange',
    },
    {
      icon: Award,
      title: 'Craftsmanship',
      description: 'Handcrafted pieces',
    },
    {
      icon: Truck,
      title: 'Free Shipping',
      description: 'Pan India delivery',
    },
  ];

  return (
    <section className="py-16 bg-gradient-to-br from-secondary/50 to-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Gem className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-2">
            The KRT Difference
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            We blend traditional artistry with modern technology to craft exceptional jewellery. Here's what sets us apart.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {promises.map((promise, index) => (
            <div
              key={index}
              className="text-center p-4 md:p-6 rounded-2xl bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
                <promise.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-sm mb-1">{promise.title}</h3>
              <p className="text-xs text-muted-foreground">{promise.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
