import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { CheckCircle2, XCircle, Eye, AlertTriangle, Loader2, Image as ImageIcon } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function AdvancedProductApproval() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingProducts();
  }, []);

  const fetchPendingProducts = async () => {
    setLoading(true);
    try {
      const result = await api.getPendingProducts();
      if (result.success) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveProduct = async (productId: number) => {
    setProcessing(true);
    try {
      const result = await api.approveProductListing(productId);
      
      if (result.success) {
        toast.success('Product approved successfully!');
        fetchPendingProducts();
        setSelectedProduct(null);
      } else {
        toast.error(result.message || 'Approval failed');
      }
    } catch (error) {
      toast.error('Error approving product');
    } finally {
      setProcessing(false);
    }
  };

  const rejectProduct = async (productId: number) => {
    if (!rejectionReason) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setProcessing(true);
    try {
      const result = await api.rejectProductListing(productId, rejectionReason);
      
      if (result.success) {
        toast.success('Product rejected');
        fetchPendingProducts();
        setSelectedProduct(null);
        setRejectionReason('');
      } else {
        toast.error(result.message || 'Rejection failed');
      }
    } catch (error) {
      toast.error('Error rejecting product');
    } finally {
      setProcessing(false);
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-red-500">High Risk</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-500">Medium Risk</Badge>;
    return <Badge className="bg-green-500">Low Risk</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pending Product Approvals</span>
            <Badge variant="secondary">{products.length} Pending</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No pending products
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Fraud Score</TableHead>
                  <TableHead>Live Photo</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images?.[0] && (
                          <img src={product.images[0]} alt="" className="w-12 h-12 rounded object-cover" />
                        )}
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-xs text-muted-foreground">{product.category}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{product.owner_name}</p>
                        {product.owner_verified && (
                          <Badge variant="outline" className="text-xs">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{parseFloat(product.rent_price || product.buy_price).toLocaleString()} RWF</TableCell>
                    <TableCell>{getRiskBadge(parseFloat(product.ai_fraud_score))}</TableCell>
                    <TableCell>
                      {product.live_photo_verified ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => setSelectedProduct(product)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Product</DialogTitle>
          </DialogHeader>

          {selectedProduct && (
            <div className="space-y-6">
              {/* Images */}
              <div>
                <h3 className="font-bold mb-3">Product Images</h3>
                <div className="grid grid-cols-3 gap-3">
                  {selectedProduct.images?.map((img: string, i: number) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      {selectedProduct.watermark_applied && (
                        <Badge className="absolute top-2 right-2 text-xs">Watermarked</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold mb-2">Product Details</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Title:</span>
                      <span className="font-medium">{selectedProduct.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{selectedProduct.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-bold">{parseFloat(selectedProduct.rent_price || selectedProduct.buy_price).toLocaleString()} RWF</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-bold mb-2">Fraud Analysis</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">AI Score:</span>
                      {getRiskBadge(parseFloat(selectedProduct.ai_fraud_score))}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Live Photo:</span>
                      {selectedProduct.live_photo_verified ? (
                        <Badge className="bg-green-500">Verified</Badge>
                      ) : (
                        <Badge className="bg-red-500">Not Verified</Badge>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Watermark:</span>
                      {selectedProduct.watermark_applied ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="font-bold mb-2">Description</h3>
                <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
              </div>

              {/* Seller Info */}
              <div className="bg-secondary/30 p-4 rounded-lg">
                <h3 className="font-bold mb-2">Seller Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <span className="ml-2 font-medium">{selectedProduct.owner_name}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Rating:</span>
                    <span className="ml-2 font-medium">{selectedProduct.owner_rating || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Verified:</span>
                    {selectedProduct.owner_verified ? (
                      <CheckCircle2 className="h-4 w-4 inline ml-2 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 inline ml-2 text-red-600" />
                    )}
                  </div>
                </div>
              </div>

              {/* Rejection Reason */}
              <div>
                <h3 className="font-bold mb-2">Rejection Reason (if rejecting)</h3>
                <Textarea
                  placeholder="Provide reason for rejection..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => rejectProduct(selectedProduct.id)}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 w-4 mr-2" />}
                  Reject
                </Button>
                <Button
                  onClick={() => approveProduct(selectedProduct.id)}
                  disabled={processing}
                  className="flex-1"
                >
                  {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Approve
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
