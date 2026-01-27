import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Star, Check, X, Eye, EyeOff, Trash2 } from 'lucide-react';

interface Review {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  title: string | null;
  content: string;
  is_approved: boolean;
  is_published: boolean;
  created_at: string;
  product?: { name: string };
}

export default function AdminReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchReviews();

    // Set up realtime subscription
    const channel = supabase
      .channel('admin-reviews')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => fetchReviews()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, product:products(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateReview = async (id: string, updates: Partial<Review>) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Review Updated',
        description: 'The review has been updated successfully.',
      });

      fetchReviews();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update review',
        variant: 'destructive',
      });
    }
  };

  const deleteReview = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Review Deleted',
        description: 'The review has been removed.',
      });

      fetchReviews();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete review',
        variant: 'destructive',
      });
    }
  };

  const pendingReviews = reviews.filter((r) => !r.is_approved);
  const approvedReviews = reviews.filter((r) => r.is_approved && !r.is_published);
  const publishedReviews = reviews.filter((r) => r.is_published);

  const renderReviewCard = (review: Review) => (
    <Card key={review.id}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < review.rating ? 'fill-primary text-primary' : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <Badge variant={review.is_published ? 'default' : review.is_approved ? 'secondary' : 'outline'}>
                {review.is_published ? 'Published' : review.is_approved ? 'Approved' : 'Pending'}
              </Badge>
            </div>
            
            {review.title && (
              <h4 className="font-semibold mb-1">{review.title}</h4>
            )}
            
            <p className="text-sm text-muted-foreground mb-2">{review.content}</p>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>By: {review.user_name}</span>
              <span>Product: {review.product?.name || 'Unknown'}</span>
              <span>{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          
          <div className="flex flex-col gap-2">
            {!review.is_approved && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => updateReview(review.id, { is_approved: true })}
              >
                <Check className="w-4 h-4" />
                Approve
              </Button>
            )}
            
            {review.is_approved && !review.is_published && (
              <Button
                size="sm"
                className="gap-1"
                onClick={() => updateReview(review.id, { is_published: true })}
              >
                <Eye className="w-4 h-4" />
                Publish
              </Button>
            )}
            
            {review.is_published && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => updateReview(review.id, { is_published: false })}
              >
                <EyeOff className="w-4 h-4" />
                Unpublish
              </Button>
            )}
            
            <Button
              size="sm"
              variant="ghost"
              className="gap-1 text-red-500 hover:text-red-600"
              onClick={() => deleteReview(review.id)}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-serif font-semibold">Review Management</h1>
          <p className="text-muted-foreground">Approve and publish customer reviews</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-yellow-500">{pendingReviews.length}</div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-500">{approvedReviews.length}</div>
              <p className="text-sm text-muted-foreground">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-500">{publishedReviews.length}</div>
              <p className="text-sm text-muted-foreground">Published</p>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              {pendingReviews.length > 0 && (
                <Badge variant="secondary">{pendingReviews.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingReviews.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No pending reviews
                </CardContent>
              </Card>
            ) : (
              pendingReviews.map(renderReviewCard)
            )}
          </TabsContent>

          <TabsContent value="approved" className="space-y-4 mt-4">
            {approvedReviews.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No approved reviews waiting to be published
                </CardContent>
              </Card>
            ) : (
              approvedReviews.map(renderReviewCard)
            )}
          </TabsContent>

          <TabsContent value="published" className="space-y-4 mt-4">
            {publishedReviews.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No published reviews yet
                </CardContent>
              </Card>
            ) : (
              publishedReviews.map(renderReviewCard)
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
