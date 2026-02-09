import { Heart, MapPin, Star, Eye, TrendingUp, Sparkles, Zap, Clock, Award, CheckCircle, Shield, Smartphone } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ProductCard } from '../product/ProductCard';
import { ProductViewPage } from './ProductViewPage';
import { AdvancedSearchBar } from '../search/AdvancedSearchBar';
import { EmptyState } from '../ui/EmptyState';
import { CategoriesShowcase } from '../categories/CategoriesShowcase';
import { api, completeApi } from '@/services';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Product } from '../../../types';

export function HomePage() {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'rent' | 'buy'>('rent');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({ total_products: 0, total_users: 0, avg_rating: 0 });
  const [loading, setLoading] = useState(true);
  const [showFullProduct, setShowFullProduct] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);

  useEffect(() => {
    loadProducts();
    loadStats();
    loadFeatured();
    loadTrending();
  }, [filters]);

  const loadProducts = async () => {
    setLoading(true);
    const response = await api.getProducts(filters);
    if (response.success) {
      setProducts(response.data);
    }
    setLoading(false);
  };

  const loadFeatured = async () => {
    const response = await api.getProducts({ sort: 'rating', limit: 4 });
    if (response.success) setFeaturedProducts(response.data);
  };

  const loadTrending = async () => {
    const response = await api.getProducts({ sort: 'popular', limit: 4 });
    if (response.success) setTrendingProducts(response.data);
  };

  const loadStats = async () => {
    const response = await api.getStats();
    if (response.success) {
      setStats(response.data);
    }
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSearch = (searchFilters: any) => {
    setFilters(searchFilters);
  };

  const filteredProducts = products.filter(product => {
    if (viewMode === 'rent') return product.rentPrice || product.rent_price;
    return product.buyPrice || product.buy_price;
  });

  if (showFullProduct && selectedProduct) {
    return <ProductViewPage product={selectedProduct} viewMode={viewMode} onBack={() => setShowFullProduct(false)} />;
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex flex-col items-center gap-6 py-8 text-center bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-primary flex items-center justify-center gap-3">
            <Sparkles className="h-10 w-10" />
            Isoko ry'u Rwanda
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Kodesha cyangwa gura ibintu byiza mu Rwanda. Marketplace yizewe n'abantu benshi.
          </p>
        </div>

        <div className="flex items-center gap-4 p-2 bg-background rounded-lg shadow-sm">
          <Switch id="view-mode" checked={viewMode === 'buy'} onCheckedChange={(checked) => setViewMode(checked ? 'buy' : 'rent')} />
          <Label htmlFor="view-mode" className="cursor-pointer flex items-center gap-2">
            <span className={viewMode === 'rent' ? 'font-bold text-primary' : 'text-muted-foreground'}>{t('rent')}</span>
            <span className="mx-2">/</span>
            <span className={viewMode === 'buy' ? 'font-bold text-primary' : 'text-muted-foreground'}>{t('buy')}</span>
          </Label>
        </div>
      </div>

      <AdvancedSearchBar onSearch={handleSearch} initialFilters={filters} />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <TrendingUp className="h-5 w-5" />
              <span className="font-bold text-2xl">{stats.total_products}+</span>
            </div>
            <p className="text-sm text-muted-foreground">Ibintu bihari</p>
          </CardContent>
        </Card>
        <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Eye className="h-5 w-5" />
              <span className="font-bold text-2xl">{stats.total_users}+</span>
            </div>
            <p className="text-sm text-muted-foreground">Abakoresha</p>
          </CardContent>
        </Card>
        <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Clock className="h-5 w-5" />
              <span className="font-bold text-2xl">24/7</span>
            </div>
            <p className="text-sm text-muted-foreground">Support</p>
          </CardContent>
        </Card>
        <Card className="border-2 hover:border-primary transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-primary mb-1">
              <Award className="h-5 w-5" />
              <span className="font-bold text-2xl">{parseFloat(stats.avg_rating).toFixed(1)}</span>
            </div>
            <p className="text-sm text-muted-foreground">Rating</p>
          </CardContent>
        </Card>
      </div>

      <CategoriesShowcase onSelectCategory={(cat) => setFilters({ ...filters, category: cat })} />

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Byose</TabsTrigger>
          <TabsTrigger value="featured"><Zap className="h-4 w-4 mr-1" />Featured</TabsTrigger>
          <TabsTrigger value="trending"><TrendingUp className="h-4 w-4 mr-1" />Trending</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{viewMode === 'rent' ? 'Ibikodeshwa' : 'Ibigurishwa'}</h2>
              <p className="text-sm text-muted-foreground">{filteredProducts.length} ibintu byabonetse</p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <div key={i} className="h-80 bg-secondary animate-pulse rounded-lg" />)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <EmptyState type="products" onAction={() => setFilters({})} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} isWishlisted={wishlist.includes(product.id.toString())} onToggleWishlist={() => toggleWishlist(product.id.toString())} onViewDetails={() => { setSelectedProduct(product); setShowFullProduct(true); }} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="featured" className="space-y-4 mt-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          {featuredProducts.length === 0 ? (
            <EmptyState type="products" onAction={() => setFilters({})} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} isWishlisted={wishlist.includes(product.id.toString())} onToggleWishlist={() => toggleWishlist(product.id.toString())} onViewDetails={() => { setSelectedProduct(product); setShowFullProduct(true); }} />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="trending" className="space-y-4 mt-6">
          <h2 className="text-2xl font-bold">Trending Now</h2>
          {trendingProducts.length === 0 ? (
            <EmptyState type="products" onAction={() => setFilters({})} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingProducts.map((product) => (
                <ProductCard key={product.id} product={product} viewMode={viewMode} isWishlisted={wishlist.includes(product.id.toString())} onToggleWishlist={() => toggleWishlist(product.id.toString())} onViewDetails={() => { setSelectedProduct(product); setShowFullProduct(true); }} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <div className="bg-secondary/50 rounded-xl p-6 space-y-4">
        <h3 className="text-xl font-bold text-center">Kuki watubera?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-bold">Abagurisha bemejwe</h4>
            <p className="text-sm text-muted-foreground">Abantu bose bemejwe bakoresha indangamuntu</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-bold">Escrow System</h4>
            <p className="text-sm text-muted-foreground">Amafaranga arakingiwe kugeza ikintu kigezeho</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <Smartphone className="h-8 w-8 text-primary" />
            </div>
            <h4 className="font-bold">Mobile Money</h4>
            <p className="text-sm text-muted-foreground">Ishyura ukoresheje MTN/Airtel Mobile Money</p>
          </div>
        </div>
      </div>
    </div>
  );
}
