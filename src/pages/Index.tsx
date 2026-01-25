import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryCarousel } from '@/components/home/CategoryCarousel';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { TrustBadges } from '@/components/home/TrustBadges';
import { GoldRateWidget } from '@/components/home/GoldRateWidget';
import { BridalBanner } from '@/components/home/BridalBanner';
import { CustomerReviews } from '@/components/home/CustomerReviews';

const Index = () => {
  return (
    <Layout>
      <CategoryCarousel />
      <HeroCarousel />
      <GoldRateWidget />
      <FeaturedProducts />
      <CategoryShowcase />
      <CustomerReviews />
      <TrustBadges />
      <BridalBanner />
    </Layout>
  );
};

export default Index;
