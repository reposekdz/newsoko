import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { GitCompare, X, Star, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function ProductComparison() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const { toast } = useToast();

  const compareProducts = async (ids: number[]) => {
    if (ids.length < 2) {
      toast({ title: 'Select at least 2 products', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const result = await api.compareProducts(ids);
      if (result.success) {
        setProducts(result.products);
        setCompareIds(ids);
      }
    } catch (error) {
      toast({ title: 'Failed to compare products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const removeProduct = (index: number) => {
    const newProducts = products.filter((_, i) => i !== index);
    setProducts(newProducts);
    if (newProducts.length < 2) {
      setCompareIds([]);
    }
  };

  const saveComparison = async () => {
    try {
      const result = await api.saveComparison(compareIds);
      if (result.success) {
        toast({ title: 'Comparison saved!' });
      }
    } catch (error) {
      toast({ title: 'Failed to save comparison', variant: 'destructive' });
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
            <GitCompare className="h-5 w-5" />
            Product Comparison
          </CardTitle>
          {products.length >= 2 && (
            <Button onClick={saveComparison} size="sm">
              Save Comparison
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <GitCompare className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No products to compare</p>
            <p className="text-sm mt-1">Add products from search results to compare</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left p-2 border-b">Feature</th>
                  {products.map((product, index) => (
                    <th key={product.id} className="p-2 border-b">
                      <div className="relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={() => removeProduct(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <img
                          src={JSON.parse(product.images)[0]}
                          alt={product.title}
                          className="w-32 h-32 object-cover rounded-lg mx-auto mb-2"
                        />
                        <p className="font-semibold text-sm">{product.title}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border-b font-medium">Price</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-2 border-b text-center">
                      <span className="text-lg font-bold text-primary">
                        {parseFloat(product.price).toLocaleString()} RWF
                      </span>
                    </td>
                  ))}
                </tr>
                
                <tr>
                  <td className="p-2 border-b font-medium">Rating</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-2 border-b text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{parseFloat(product.avg_rating || 0).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({product.review_count})
                        </span>
                      </div>
                    </td>
                  ))}
                </tr>
                
                <tr>
                  <td className="p-2 border-b font-medium">Condition</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-2 border-b text-center">
                      <Badge>{product.condition}</Badge>
                    </td>
                  ))}
                </tr>
                
                <tr>
                  <td className="p-2 border-b font-medium">Category</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-2 border-b text-center">
                      {product.category}
                    </td>
                  ))}
                </tr>
                
                <tr>
                  <td className="p-2 border-b font-medium">Seller</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-2 border-b text-center">
                      {product.seller_name}
                    </td>
                  ))}
                </tr>
                
                <tr>
                  <td className="p-2 border-b font-medium">Location</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-2 border-b text-center">
                      {product.location}
                    </td>
                  ))}
                </tr>
                
                <tr>
                  <td className="p-2 font-medium">Status</td>
                  {products.map((product) => (
                    <td key={product.id} className="p-2 text-center">
                      <Badge variant={product.status === 'available' ? 'default' : 'secondary'}>
                        {product.status}
                      </Badge>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
