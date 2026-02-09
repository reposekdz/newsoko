import { Heart, MapPin, Star, Eye, Calendar, BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Product } from '../../../types';
import { cn } from '../ui/utils';

interface ProductCardProps {
  product: Product;
  viewMode: 'rent' | 'buy';
  isWishlisted?: boolean;
  onToggleWishlist?: () => void;
  onViewDetails?: () => void;
}

export function ProductCard({
  product,
  viewMode,
  isWishlisted = false,
  onToggleWishlist,
  onViewDetails,
}: ProductCardProps) {
  const { t } = useTranslation();

  const price = viewMode === 'rent' ? (product.rentPrice || product.rent_price) : (product.buyPrice || product.buy_price);
  const priceLabel = viewMode === 'rent' ? t('rentPerDay') : t('buyPrice');

  if (!price) return null;

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
      <div className="relative overflow-hidden aspect-[4/3]" onClick={onViewDetails}>
        <img
          src={product.images[0]}
          alt={product.title}
          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Wishlist Button */}
        <Button
          variant="secondary"
          size="icon"
          className={cn(
            "absolute top-2 right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
            isWishlisted && "opacity-100"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist?.();
          }}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-red-500 text-red-500")} />
        </Button>

        {/* Condition Badge */}
        {product.condition && (
          <Badge className="absolute top-2 left-2 bg-primary/90">
            {product.condition === 'new' && 'Gishya'}
            {product.condition === 'like-new' && 'Nk\'igishya'}
            {product.condition === 'good' && 'Nziza'}
            {product.condition === 'fair' && 'Isanzwe'}
          </Badge>
        )}

        {/* Status Badge */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <Badge variant="destructive" className="text-lg">
              Ntibikiri bihari
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4 space-y-3" onClick={onViewDetails}>
        {/* Title */}
        <h3 className="font-bold line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        {/* Owner Info */}
        {product.owner && (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={product.owner.avatar} />
              <AvatarFallback>{product.owner.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">{product.owner.name || 'User'}</span>
            {product.owner.isVerified && (
              <BadgeCheck className="h-4 w-4 text-primary" />
            )}
          </div>
        )}

        {/* Location */}
        {product.location && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="line-clamp-1">{product.location.address || product.address || 'Kigali'}</span>
          </div>
        )}

        {/* Rating */}
        {product.rating && Number(product.rating) > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{Number(product.rating).toFixed(1)}</span>
            </div>
            <span className="text-sm text-muted-foreground">
              ({product.reviewCount || product.review_count || 0} {t('reviews')})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="pt-2">
          <div className="text-2xl font-bold text-primary">
            {price.toLocaleString()} RWF
          </div>
          <div className="text-sm text-muted-foreground">{priceLabel}</div>
          {product.deposit && viewMode === 'rent' && (
            <div className="text-xs text-muted-foreground mt-1">
              + {product.deposit.toLocaleString()} RWF (Ingwate)
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex-col gap-2">
        <Button variant="outline" size="sm" className="w-full" onClick={onViewDetails}>
          <Eye className="h-4 w-4 mr-1" />
          {t('viewDetails')}
        </Button>
        <Button size="sm" className="w-full" onClick={onViewDetails}>
          <Calendar className="h-4 w-4 mr-1" />
          {viewMode === 'rent' ? t('bookNow') : t('buy')}
        </Button>
      </CardFooter>
    </Card>
  );
}
