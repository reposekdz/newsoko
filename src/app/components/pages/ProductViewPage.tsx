import { ArrowLeft, Heart, Share2, MapPin, Star, Shield, BadgeCheck, MessageSquare, Calendar, Phone, Mail, TrendingUp, Package, Clock, CheckCircle, ShoppingCart, Send, Eye, Users, Zap, Award, RefreshCw, AlertCircle, Info, ChevronLeft, ChevronRight, Car, Home, Laptop, Shirt, Sofa, Wrench, Hammer, Dumbbell, Book, Sparkles } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Product } from '../../../types';
import { BookingPurchaseFlow } from '../booking/BookingPurchaseFlow';
import { api, completeApi } from '@/services';
import { useAuth } from '../../../context/AuthContext';

interface ProductViewPageProps {
  product: Product;
  viewMode: 'rent' | 'buy';
  onBack: () => void;
}

export function ProductViewPage({ product, viewMode, onBack }: ProductViewPageProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [message, setMessage] = useState('');
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [availability, setAvailability] = useState<any[]>([]);
  const [stats, setStats] = useState({ views: 0, interested: 0, booked: 0 });
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [scrollPosition, setScrollPosition] = useState(0);

  const categories = [
    { name: 'Ibinyabiziga', icon: Car },
    { name: 'Amazu', icon: Home },
    { name: 'Ikoranabuhanga', icon: Laptop },
    { name: 'Imyambaro', icon: Shirt },
    { name: 'Ibikoresho', icon: Sofa },
    { name: 'Ibikoresho', icon: Wrench },
    { name: 'Ubwubatsi', icon: Hammer },
    { name: 'Siporo', icon: Dumbbell },
    { name: 'Ibitabo', icon: Book },
    { name: 'Ubwiza', icon: Sparkles },
  ];

  const price = viewMode === 'rent' ? product.rentPrice : product.buyPrice;
  const isOwner = user?.id === product.owner?.id;

  useEffect(() => {
    loadReviews();
    trackView();
    checkFavorite();
    loadProductStats();
    loadRelatedProducts();
    if (isOwner) {
      loadActiveOrders();
      loadAvailability();
    }
  }, [product.id, isOwner]);

  useEffect(() => {
    if (!autoRefresh || !isOwner) return;
    const interval = setInterval(() => {
      loadActiveOrders();
      loadProductStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, isOwner]);

  const loadReviews = async () => {
    const response = await api.getReviews(product.id);
    if (response.success) setReviews(response.data);
  };

  const trackView = async () => {
    await api.trackProductView(product.id);
  };

  const checkFavorite = async () => {
    if (!user) return;
    const response = await api.getFavorites();
    if (response.success) {
      setIsWishlisted(response.data.some((f: any) => f.product_id === product.id));
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) return;
    if (isWishlisted) {
      await api.removeFavorite(product.id);
    } else {
      await api.addFavorite(product.id);
    }
    setIsWishlisted(!isWishlisted);
  };

  const handleAddReview = async () => {
    if (!user || !newReview.comment) return;
    const response = await api.addReview(product.id, newReview.rating, newReview.comment);
    if (response.success) {
      loadReviews();
      setNewReview({ rating: 5, comment: '' });
    }
  };

  const handleSendMessage = async () => {
    if (!user || !message) return;
    const response = await api.sendMessage(product.owner.id, message, product.id);
    if (response.success) {
      setMessage('');
      alert('Message sent!');
    }
  };

  const loadActiveOrders = async () => {
    setLoading(true);
    const response = await api.getBookings();
    if (response.success) {
      const orders = response.data.filter((b: any) => 
        b.product_id === product.id && ['pending', 'confirmed', 'active'].includes(b.status)
      );
      setActiveOrders(orders);
    }
    setLoading(false);
  };

  const loadAvailability = async () => {
    const response = await api.getBookings();
    if (response.success) {
      const bookings = response.data.filter((b: any) => 
        b.product_id === product.id && b.status !== 'cancelled'
      );
      setAvailability(bookings);
    }
  };

  const loadProductStats = async () => {
    const response = await api.getAnalytics();
    if (response.success) {
      const productStats = response.data.products?.find((p: any) => p.id === product.id);
      if (productStats) {
        setStats({
          views: productStats.views || 0,
          interested: productStats.favorites || 0,
          booked: productStats.bookings || 0
        });
      }
    }
  };

  const handleQuickApprove = async (orderId: number) => {
    const response = await api.updateBooking(orderId, { status: 'confirmed' });
    if (response.success) {
      loadActiveOrders();
      alert('Order approved!');
    }
  };

  const handleQuickReject = async (orderId: number) => {
    const response = await api.updateBooking(orderId, { status: 'cancelled' });
    if (response.success) {
      loadActiveOrders();
      alert('Order rejected!');
    }
  };

  const loadRelatedProducts = async () => {
    setLoading(true);
    const response = await api.getRelatedProducts(product.id, 8);
    if (response.success) {
      setRelatedProducts(response.data);
    }
    setLoading(false);
  };

  const handleRelatedProductClick = async (relatedProduct: Product) => {
    await api.trackRelatedProductClick(product.id, relatedProduct.id);
    // Navigate to related product (implement navigation logic)
    window.location.href = `#product-${relatedProduct.id}`;
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    const container = document.getElementById('categories-scroll');
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Subira
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleToggleFavorite}>
              <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </Button>
            <Button variant="outline" size="icon">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* Categories Scroll Bar */}
        <div className="border-t bg-background">
          <div className="container mx-auto px-4 py-3 relative">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0"
                onClick={() => scrollCategories('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div 
                id="categories-scroll"
                className="flex gap-2 overflow-x-auto scrollbar-hide scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {categories.map((cat, idx) => {
                  const Icon = cat.icon;
                  return (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="shrink-0 gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {cat.name}
                    </Button>
                  );
                })}
              </div>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 shrink-0"
                onClick={() => scrollCategories('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-8">
          <div className="space-y-3 sm:space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-secondary">
              <img src={product.images[selectedImage]} alt={product.title} className="w-full h-full object-cover" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, idx) => (
                <button key={idx} onClick={() => setSelectedImage(idx)} className={`aspect-video rounded-lg overflow-hidden border-2 ${selectedImage === idx ? 'border-primary' : 'border-transparent'}`}>
                  <img src={img} alt={`${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
            <div>
              <div className="flex items-start justify-between mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold">{product.title}</h1>
                {product.condition && (
                  <Badge variant="secondary" className="text-sm">
                    {product.condition === 'new' && 'Gishya'}
                    {product.condition === 'like-new' && 'Nk\'igishya'}
                    {product.condition === 'good' && 'Nziza'}
                    {product.condition === 'fair' && 'Isanzwe'}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-muted-foreground">
                {product.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{product.location.address || product.address || 'Kigali'}</span>
                  </div>
                )}
                {product.rating && Number(product.rating) > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{Number(product.rating).toFixed(1)}</span>
                    <span>({product.reviewCount || product.review_count || 0})</span>
                  </div>
                )}
              </div>
            </div>

            <Card className="border-2 border-primary">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {price?.toLocaleString()} RWF
                    </div>
                    <div className="text-muted-foreground">
                      {viewMode === 'rent' ? 'Ku munsi umwe' : 'Igiciro cyo kugura'}
                    </div>
                  </div>
                  {product.isAvailable ? (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Birahari
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Ntibikiri
                    </Badge>
                  )}
                </div>
                
                {viewMode === 'rent' && (
                  <div className="space-y-2 mb-4">
                    {product.deposit && (
                      <div className="flex items-center justify-between text-sm bg-secondary/50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Ingwate</span>
                        </div>
                        <span className="font-bold">{product.deposit.toLocaleString()} RWF</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm bg-blue-500/10 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-500" />
                        <span>Instant Booking</span>
                      </div>
                      <Badge variant="outline" className="text-blue-500">Available</Badge>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 bg-secondary/30 rounded">
                    <Eye className="h-4 w-4 mx-auto mb-1" />
                    <div className="font-bold">{stats.views}</div>
                    <div className="text-xs text-muted-foreground">Views</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <Heart className="h-4 w-4 mx-auto mb-1" />
                    <div className="font-bold">{stats.interested}</div>
                    <div className="text-xs text-muted-foreground">Likes</div>
                  </div>
                  <div className="p-2 bg-secondary/30 rounded">
                    <Calendar className="h-4 w-4 mx-auto mb-1" />
                    <div className="font-bold">{stats.booked}</div>
                    <div className="text-xs text-muted-foreground">Booked</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {!isOwner && (
              <div className="space-y-3">
                <Button size="lg" className="w-full" onClick={() => setShowBookingModal(true)} disabled={!product.isAvailable}>
                  {viewMode === 'rent' ? (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Instant Booking
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5 mr-2" />
                      Gura Ubu
                    </>
                  )}
                </Button>
                {viewMode === 'rent' && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-500/5 p-3 rounded-lg">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span>Instant confirmation • Secure payment • 24/7 support</span>
                  </div>
                )}
              </div>
            )}
            
            {isOwner && activeOrders.length > 0 && (
              <Card className="border-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Active Orders ({activeOrders.length})
                    </h3>
                    <Button size="sm" variant="ghost" onClick={loadActiveOrders} disabled={loading}>
                      <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {activeOrders.map((order: any) => (
                      <div key={order.id} className="p-3 bg-secondary/50 rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold">{order.user_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(order.start_date).toLocaleDateString()} - {new Date(order.end_date).toLocaleDateString()}
                            </div>
                          </div>
                          <Badge variant={order.status === 'pending' ? 'default' : 'secondary'}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm font-bold text-primary">
                          {order.total_amount?.toLocaleString()} RWF
                        </div>
                        {order.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" className="flex-1" onClick={() => handleQuickApprove(order.id)}>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleQuickReject(order.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-bold">Andikira Nyir'ibintu</h3>
                <Textarea 
                  placeholder="Type your message..." 
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
                <Button className="w-full" onClick={handleSendMessage} disabled={!user || !message}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={product.owner?.avatar} />
                    <AvatarFallback>{product.owner?.name?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-lg">{product.owner?.name || 'User'}</span>
                      {product.owner?.isVerified && <BadgeCheck className="h-5 w-5 text-primary" />}
                    </div>
                    {product.owner?.rating && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span>{Number(product.owner.rating).toFixed(1)}</span>
                        </div>
                        <span>•</span>
                        <span>{product.owner.reviewCount || 0} reviews</span>
                      </div>
                    )}
                    {product.owner?.phone && (
                      <div className="flex gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Phone className="h-3 w-3 mr-1" />
                          {product.owner.phone}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="description">Ibisobanuro</TabsTrigger>
              <TabsTrigger value="features">Ibimenyetso</TabsTrigger>
              {viewMode === 'rent' && <TabsTrigger value="availability">Availability</TabsTrigger>}
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <p className="text-lg whitespace-pre-line">{product.description}</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="features" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {product.features?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-secondary/50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-primary" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {viewMode === 'rent' && (
              <TabsContent value="availability" className="mt-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold">Booking Calendar</h3>
                        <Badge variant="outline">{availability.length} bookings</Badge>
                      </div>
                      {availability.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No bookings yet. This item is fully available!</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {availability.map((booking: any) => (
                            <div key={booking.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                              <div>
                                <div className="font-medium">{booking.user_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {new Date(booking.start_date).toLocaleDateString()} → {new Date(booking.end_date).toLocaleDateString()}
                                </div>
                              </div>
                              <Badge variant={booking.status === 'active' ? 'default' : 'secondary'}>
                                {booking.status}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-green-700 dark:text-green-400">Available dates can be booked instantly</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardContent className="p-6 space-y-6">
                  {user && (
                    <div className="space-y-3 pb-6 border-b">
                      <h3 className="font-bold">Add Review</h3>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <Star 
                            key={star}
                            className={`h-6 w-6 cursor-pointer ${star <= newReview.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            onClick={() => setNewReview({...newReview, rating: star})}
                          />
                        ))}
                      </div>
                      <Textarea 
                        placeholder="Share your experience..."
                        value={newReview.comment}
                        onChange={(e) => setNewReview({...newReview, comment: e.target.value})}
                        rows={3}
                      />
                      <Button onClick={handleAddReview} disabled={!newReview.comment}>Submit Review</Button>
                    </div>
                  )}
                  
                  {reviews.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nta reviews zihari ubu</p>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((review: any) => (
                        <div key={review.id} className="flex gap-3 p-4 bg-secondary/30 rounded-lg">
                          <Avatar>
                            <AvatarImage src={review.user_avatar} />
                            <AvatarFallback>{review.user_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold">{review.user_name}</span>
                              <div className="flex gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground">{review.comment}</p>
                            <span className="text-xs text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Ibindi Bintu Bifitanye Isano</h2>
              <Button variant="ghost" size="sm">
                Reba Byose
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {relatedProducts.map((relatedProduct) => (
                <Card 
                  key={relatedProduct.id} 
                  className="group cursor-pointer hover:shadow-lg transition-all"
                  onClick={() => handleRelatedProductClick(relatedProduct)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={relatedProduct.images[0]} 
                      alt={relatedProduct.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {relatedProduct.condition && (
                      <Badge className="absolute top-2 left-2 text-xs">
                        {relatedProduct.condition === 'new' && 'Gishya'}
                        {relatedProduct.condition === 'like-new' && 'Nk\'igishya'}
                        {relatedProduct.condition === 'good' && 'Nziza'}
                      </Badge>
                    )}
                    {relatedProduct.relevanceScore && (
                      <Badge className="absolute top-2 right-2 text-xs bg-blue-500">
                        {relatedProduct.relevanceScore}% Match
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-bold line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                      {relatedProduct.title}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-3 w-3" />
                      <span className="line-clamp-1">{relatedProduct.location?.address || 'Kigali'}</span>
                    </div>
                    {relatedProduct.rating && Number(relatedProduct.rating) > 0 && (
                      <div className="flex items-center gap-1 mb-2">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-bold">{Number(relatedProduct.rating).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({relatedProduct.reviewCount})</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-primary">
                          {(viewMode === 'rent' ? relatedProduct.rentPrice : relatedProduct.buyPrice)?.toLocaleString()} RWF
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {viewMode === 'rent' ? 'Ku munsi' : 'Igiciro'}
                        </div>
                      </div>
                      {relatedProduct.favoritesCount > 0 && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Heart className="h-3 w-3" />
                          {relatedProduct.favoritesCount}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {showBookingModal && (
        <BookingPurchaseFlow product={product} viewMode={viewMode} isOpen={showBookingModal} onClose={() => setShowBookingModal(false)} />
      )}
    </div>
  );
}
