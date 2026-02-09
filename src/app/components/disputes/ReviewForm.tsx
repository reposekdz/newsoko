import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

const ReviewForm = ({ booking, onClose, onSuccess }) => {
  const [productRating, setProductRating] = useState(0);
  const [sellerRating, setSellerRating] = useState(0);
  const [productReview, setProductReview] = useState('');
  const [sellerReview, setSellerReview] = useState('');
  const [loading, setLoading] = useState(false);

  const StarRating = ({ rating, setRating, label }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">{label}</label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              size={32}
              fill={star <= rating ? '#FCD34D' : 'none'}
              stroke={star <= rating ? '#FCD34D' : '#D1D5DB'}
            />
          </button>
        ))}
      </div>
    </div>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await fetch('/api/controllers/ratings_reviews.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_review',
          booking_id: booking.id,
          rating: productRating,
          review: productReview,
          review_type: 'product'
        })
      });

      await fetch('/api/controllers/ratings_reviews.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_review',
          booking_id: booking.id,
          rating: sellerRating,
          review: sellerReview,
          review_type: 'seller'
        })
      });

      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Leave a Review</h2>
            <button onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <StarRating rating={productRating} setRating={setProductRating} label="Rate the Product" />
            <textarea
              value={productReview}
              onChange={(e) => setProductReview(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-4"
              rows="3"
              placeholder="Share your experience with this product..."
              required
            />

            <StarRating rating={sellerRating} setRating={setSellerRating} label="Rate the Seller" />
            <textarea
              value={sellerReview}
              onChange={(e) => setSellerReview(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg mb-6"
              rows="3"
              placeholder="How was your experience with the seller?"
              required
            />

            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-6 py-3 border rounded-lg">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-blue-500 text-white rounded-lg">
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReviewForm;
