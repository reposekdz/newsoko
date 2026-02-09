import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Star, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

interface ReviewsRatingsProps {
  productId?: number;
  sellerId?: number;
  bookingId?: number;
  type: 'product' | 'seller';
}

export function ReviewsRatings({ productId, sellerId, bookingId, type }: ReviewsRatingsProps) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [productId, sellerId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const result = type === 'product' 
        ? await api.getProductReviews(productId!)
        : await api.getSellerReviews(sellerId!);
      
      if (result.success) {
        setReviews(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitReview = async () => {
    if (!rating || !reviewText) {
      toast.error('Please provide rating and review');
      return;
    }

    setSubmitting(true);
    try {
      const result = await api.submitReview({
        booking_id: bookingId,
        rating,
        review: reviewText,
        review_type: type
      });

      if (result.success) {
        toast.success('Review submitted successfully!');
        setShowForm(false);
        setRating(0);
        setReviewText('');
        fetchReviews();
      } else {
        toast.error(result.message || 'Failed to submit review');
      }
    } catch (error) {
      toast.error('Error submitting review');
    } finally {
      setSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-4xl font-bold">{averageRating.toFixed(1)}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${star <= averageRating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{reviews.length} reviews</p>
            </div>

            {bookingId && (
              <Button onClick={() => setShowForm(!showForm)}>
                Write Review
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write a Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Your Review</label>
              <Textarea
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={submitReview} disabled={submitting} className="flex-1">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Submit Review
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
          </Card>
        ) : reviews.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-muted-foreground">
              No reviews yet
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar>
                    <AvatarImage src={review.reviewer_avatar} />
                    <AvatarFallback>{review.reviewer_name?.[0]}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium">{review.reviewer_name}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm mb-3">{review.review}</p>

                    {review.seller_reply && (
                      <div className="bg-secondary/30 p-3 rounded-lg mt-3">
                        <p className="text-xs font-medium mb-1">Seller Reply:</p>
                        <p className="text-sm">{review.seller_reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
