import { useState } from 'react';
import { Star, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

interface Review {
  id: string;
  userName: string;
  rating: number;
  title: string;
  text: string;
  date: string;
  verified: boolean;
  helpful: number;
  notHelpful: number;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

// Sample reviews for display
const sampleReviews: Review[] = [
  {
    id: '1',
    userName: 'Priya S.',
    rating: 5,
    title: 'Breathtaking Quality!',
    text: 'The craftsmanship is exceptional. The gold has a beautiful shine and the design is exactly as shown in the pictures. Delivery was prompt and well-packaged.',
    date: '2 weeks ago',
    verified: true,
    helpful: 12,
    notHelpful: 0,
  },
  {
    id: '2',
    userName: 'Rahul M.',
    rating: 5,
    title: 'Perfect Anniversary Gift',
    text: 'Bought this for my wife and she absolutely loved it! The quality is outstanding and worth every rupee. KRT Jewels never disappoints.',
    date: '1 month ago',
    verified: true,
    helpful: 8,
    notHelpful: 1,
  },
  {
    id: '3',
    userName: 'Lakshmi K.',
    rating: 5,
    title: 'Excellent Service',
    text: 'The ordering process was smooth and the delivery was quick. The jewellery came in a beautiful box, ready for gifting. Highly recommended!',
    date: '3 weeks ago',
    verified: true,
    helpful: 5,
    notHelpful: 0,
  },
];

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${sizeClass} ${
            i < rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'
          }`}
        />
      ))}
    </div>
  );
}

function StarSelector({ rating, onSelect }: { rating: number; onSelect: (r: number) => void }) {
  const [hovered, setHovered] = useState(0);
  
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onMouseEnter={() => setHovered(i + 1)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onSelect(i + 1)}
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              i < (hovered || rating)
                ? 'fill-primary text-primary'
                : 'text-muted-foreground/30'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, title: '', text: '' });

  const averageRating = 5.0;
  const totalReviews = sampleReviews.length;

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would submit to the backend
    console.log('Submitting review:', newReview);
    setShowForm(false);
    setNewReview({ rating: 0, title: '', text: '' });
  };

  return (
    <div className="mt-12 pt-12 border-t border-border">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-serif text-2xl font-semibold mb-2">Verified Customer Reviews</h2>
          <div className="flex items-center gap-3">
            <StarRating rating={Math.round(averageRating)} size="md" />
            <span className="text-lg font-medium">{averageRating}</span>
            <span className="text-muted-foreground">({totalReviews} reviews)</span>
          </div>
        </div>
        {isAuthenticated && !showForm && (
          <Button onClick={() => setShowForm(true)} variant="outline">
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmitReview} className="bg-secondary/30 rounded-xl p-6 mb-8">
          <h3 className="font-semibold mb-4">Write Your Review</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Your Rating</label>
              <StarSelector
                rating={newReview.rating}
                onSelect={(r) => setNewReview({ ...newReview, rating: r })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Review Title</label>
              <Input
                value={newReview.title}
                onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                placeholder="Summarize your experience"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                value={newReview.text}
                onChange={(e) => setNewReview({ ...newReview, text: e.target.value })}
                placeholder="Share your experience with this product..."
                rows={4}
              />
            </div>
            
            <div className="flex gap-3">
              <Button type="submit" className="btn-premium">
                Submit Review
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </form>
      )}

      {/* Reviews List */}
      <div className="space-y-6">
        {sampleReviews.map((review) => (
          <div key={review.id} className="border-b border-border pb-6 last:border-0">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-semibold">
                {review.userName.charAt(0)}
              </div>
              
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{review.userName}</span>
                  {review.verified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      Verified Buyer
                    </span>
                  )}
                </div>
                
                {/* Rating & Date */}
                <div className="flex items-center gap-3 mb-2">
                  <StarRating rating={review.rating} />
                  <span className="text-sm text-muted-foreground">{review.date}</span>
                </div>
                
                {/* Title */}
                <h4 className="font-semibold mb-2">{review.title}</h4>
                
                {/* Text */}
                <p className="text-muted-foreground mb-4">{review.text}</p>
                
                {/* Helpful Actions */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Was this review helpful?</span>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <ThumbsUp className="w-4 h-4" />
                    <span>{review.helpful}</span>
                  </button>
                  <button className="flex items-center gap-1 hover:text-foreground transition-colors">
                    <ThumbsDown className="w-4 h-4" />
                    <span>{review.notHelpful}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
