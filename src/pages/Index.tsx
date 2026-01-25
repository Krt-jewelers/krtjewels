import { Layout } from '@/components/layout/Layout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { TrustBadges } from '@/components/home/TrustBadges';
import { GoldRateWidget } from '@/components/home/GoldRateWidget';
import { BridalBanner } from '@/components/home/BridalBanner';

const Index = () => {
  return (
    <Layout>
      <HeroCarousel />
      <GoldRateWidget />
      <CategoryShowcase />
      <FeaturedProducts />
      <TrustBadges />
      <BridalBanner />
    </Layout>
  );
};

export default Index;
