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
import { InstagramFeed } from '@/components/home/InstagramFeed';
import { MarqueeSection } from '@/components/home/MarqueeSection';
import { RotatingCardsSection } from '@/components/home/RotatingCardsSection';
import { GoogleReviewBadge } from '@/components/home/GoogleReviewBadge';
import { CraftsmanshipVideo } from '@/components/home/CraftsmanshipVideo';
import { JournalSection } from '@/components/home/JournalSection';

const Index = () => {
  
  return (
    <Layout>
      <HeroCarousel />
      <CategoryCarousel />
      <MarqueeSection />
      <GoldRateWidget />
      <FeaturedProducts />
      <CraftsmanshipVideo />
      <CollectionBanner />
      <WhyChooseUs />
      <CustomerReviews />
      <BridalBanner />
      <JournalSection />
      <TrustBadges />
      <InstagramFeed />
      <GoogleReviewBadge />
    </Layout>
  );
};

export default Index;
