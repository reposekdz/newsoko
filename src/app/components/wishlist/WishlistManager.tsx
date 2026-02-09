import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Heart, Trash2, Bell, BellOff, Loader2, ShoppingCart } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function WishlistManager() {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const result = await api.getWishlist();
      if (result.success) {
        setWishlist(result.wishlist);
      }
    } catch (error) {
      toast({ title: 'Failed to load wishlist', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (wishlistId: number) => {
    try {
      const result = await api.removeFromWishlist(wishlistId);
      if (result.success) {
        toast({ title: 'Removed from wishlist' });
        fetchWishlist();
      }
    } catch (error) {
      toast({ title: 'Failed to remove', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            My Wishlist ({wishlist.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {wishlist.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">Your wishlist is empty</p>
            <p className="text-sm text-muted-foreground mt-1">Save items you love for later</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="relative">
                  <img
                    src={JSON.parse(item.images)[0] || '/placeholder.jpg'}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <Badge className="absolute top-2 right-2" variant={item.status === 'available' ? 'default' : 'secondary'}>
                    {item.status}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xl font-bold text-primary">
                      {parseFloat(item.price).toLocaleString()} RWF
                    </p>
                    {item.price_alert_enabled && (
                      <Bell className="h-4 w-4 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Seller: {item.seller_name}
                  </p>
                  {item.notes && (
                    <p className="text-sm text-muted-foreground mb-3 italic">
                      Note: {item.notes}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => removeFromWishlist(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
