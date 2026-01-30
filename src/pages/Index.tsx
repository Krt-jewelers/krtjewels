import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryCarousel } from '@/components/home/CategoryCarousel';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { TrustBadges } from '@/components/home/TrustBadges';
import { GoldRateWidget } from '@/components/home/GoldRateWidget';
import { BridalBanner } from '@/components/home/BridalBanner';
import { CustomerReviews } from '@/components/home/CustomerReviews';
import { CollectionBanner } from '@/components/home/CollectionBanner';
import { WhyChooseUs } from '@/components/home/WhyChooseUs';
import { NewsletterSection } from '@/components/home/NewsletterSection';
import { InstagramFeed } from '@/components/home/InstagramFeed';
import { useRealtimeSync } from '@/hooks/useRealtimeSync';

const Index = () => {
  // Enable realtime sync for products, gold rates, and stock
  useRealtimeSync();
  
  return (
    <Layout>
      <CategoryCarousel />
      <HeroCarousel />
      <GoldRateWidget />
      <FeaturedProducts />
      <CollectionBanner />
      <CategoryShowcase />
      <WhyChooseUs />
      <CustomerReviews />
      <BridalBanner />
      <TrustBadges />
      <InstagramFeed />
      <NewsletterSection />
    </Layout>
  );
};

export default Index;
