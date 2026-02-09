import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function AdminProductApproval() {
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const result = await api.getAdminProductsPending();
      if (result.success) setProducts(result.data);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (productId: number) => {
    const result = await api.adminApproveProduct(productId);
    if (result.success) {
      toast.success('Product approved');
      loadProducts();
    }
  };

  const handleReject = async (productId: number) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    
    const result = await api.adminRejectProduct(productId, reason);
    if (result.success) {
      toast.success('Product rejected');
      loadProducts();
    }
  };

  const handleBulkApprove = async () => {
    if (selected.length === 0) return;
    
    const result = await api.adminBulkAction('approve', selected);
    if (result.success) {
      toast.success(result.message);
      setSelected([]);
      loadProducts();
    }
  };

  const handleBulkReject = async () => {
    if (selected.length === 0) return;
    
    const reason = prompt('Rejection reason for all selected:');
    if (!reason) return;
    
    for (const id of selected) {
      await api.adminRejectProduct(id, reason);
    }
    
    toast.success(`${selected.length} products rejected`);
    setSelected([]);
    loadProducts();
  };

  const toggleSelect = (id: number) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Product Approval</h1>
        {selected.length > 0 && (
          <div className="flex gap-2">
            <Button onClick={handleBulkApprove}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve {selected.length}
            </Button>
            <Button variant="destructive" onClick={handleBulkReject}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject {selected.length}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        {products.map((product) => (
          <Card key={product.id}>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <input
                  type="checkbox"
                  checked={selected.includes(product.id)}
                  onChange={() => toggleSelect(product.id)}
                  className="mt-1"
                />

                <div className="grid grid-cols-4 gap-2 w-48">
                  {product.images?.slice(0, 4).map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`Product ${idx + 1}`}
                      className="w-full h-20 object-cover rounded"
                    />
                  ))}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-lg">{product.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{product.description}</p>
                    </div>
                    {product.ai_fraud_score > 0.5 && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        High Risk: {(product.ai_fraud_score * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-sm"><span className="font-medium">Category:</span> {product.category_name}</p>
                      <p className="text-sm"><span className="font-medium">Owner:</span> {product.owner_name}</p>
                      <p className="text-sm"><span className="font-medium">Condition:</span> {product.condition_status}</p>
                    </div>
                    <div>
                      <p className="text-sm"><span className="font-medium">Rent:</span> {product.rent_price ? `${product.rent_price} RWF/day` : 'N/A'}</p>
                      <p className="text-sm"><span className="font-medium">Buy:</span> {product.buy_price ? `${product.buy_price} RWF` : 'N/A'}</p>
                      <p className="text-sm"><span className="font-medium">Deposit:</span> {product.deposit || 0} RWF</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Badge variant={product.live_photo_verified ? 'default' : 'secondary'}>
                      {product.live_photo_verified ? 'Photo Verified' : 'Not Verified'}
                    </Badge>
                    <Badge variant="outline">
                      Fraud Score: {(product.ai_fraud_score * 100).toFixed(0)}%
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => handleApprove(product.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleReject(product.id)}>
                    <XCircle className="h-4 w-4 mr-1" /> Reject
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No pending products
          </CardContent>
        </Card>
      )}
    </div>
  );
}
