import { Package, Upload, Plus, X, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { Badge } from '../ui/badge';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export function AddEditProductPage({ productId = null, onSuccess }: any) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    rent_price: '',
    buy_price: '',
    deposit: '',
    address: '',
    condition_status: 'good',
    sku: '',
    stock_quantity: 0,
    weight: '',
    dimensions: '',
    brand: '',
    model: '',
    year_manufactured: '',
    warranty_period: '',
    is_featured: false,
    discount_percentage: 0,
    seo_title: '',
    seo_description: '',
    images: [] as string[],
    features: [] as string[],
    tags: [] as string[],
    attributes: [] as any[],
    variants: [] as any[]
  });

  const [newFeature, setNewFeature] = useState('');
  const [newTag, setNewTag] = useState('');
  const [newAttribute, setNewAttribute] = useState({ name: '', value: '' });
  const [newVariant, setNewVariant] = useState({ name: '', value: '', price_adjustment: 0, stock_quantity: 0 });

  useEffect(() => {
    loadCategories();
    if (productId) loadProduct();
  }, [productId]);

  const loadCategories = async () => {
    const response = await api.getAdminCategories();
    if (response.success) setCategories(response.data);
  };

  const loadProduct = async () => {
    const response = await api.getProduct(productId);
    if (response.success) {
      const p = response.data;
      setFormData({
        ...formData,
        ...p,
        category_id: p.category_id?.toString() || '',
        images: p.images || [],
        features: p.features || [],
        tags: p.tags || [],
        attributes: p.attributes || [],
        variants: p.variants || []
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const productData = {
      ...formData,
      owner_id: user.id,
      id: productId
    };

    const response = productId 
      ? await api.updateProduct(productData)
      : await api.createProduct(productData);

    setLoading(false);

    if (response.success) {
      alert(productId ? 'Product updated successfully!' : 'Product created successfully!');
      if (onSuccess) onSuccess();
    } else {
      alert('Error: ' + response.message);
    }
  };

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({ ...formData, features: [...formData.features, newFeature] });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({ ...formData, features: formData.features.filter((_, i) => i !== index) });
  };

  const addTag = () => {
    if (newTag.trim()) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] });
      setNewTag('');
    }
  };

  const removeTag = (index: number) => {
    setFormData({ ...formData, tags: formData.tags.filter((_, i) => i !== index) });
  };

  const addAttribute = () => {
    if (newAttribute.name && newAttribute.value) {
      setFormData({ ...formData, attributes: [...formData.attributes, newAttribute] });
      setNewAttribute({ name: '', value: '' });
    }
  };

  const removeAttribute = (index: number) => {
    setFormData({ ...formData, attributes: formData.attributes.filter((_, i) => i !== index) });
  };

  const addVariant = () => {
    if (newVariant.name && newVariant.value) {
      setFormData({ ...formData, variants: [...formData.variants, newVariant] });
      setNewVariant({ name: '', value: '', price_adjustment: 0, stock_quantity: 0 });
    }
  };

  const removeVariant = (index: number) => {
    setFormData({ ...formData, variants: formData.variants.filter((_, i) => i !== index) });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2">
          <Package className="h-8 w-8" />
          <h1 className="text-3xl font-bold">{productId ? 'Edit Product' : 'Add New Product'}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Product Title *</Label>
                <Input 
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Description *</Label>
                <Textarea 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category *</Label>
                  <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Condition</Label>
                  <Select value={formData.condition_status} onValueChange={(value) => setFormData({ ...formData, condition_status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="like-new">Like New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pricing & Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Rent Price (RWF/day)</Label>
                  <Input 
                    type="number"
                    value={formData.rent_price}
                    onChange={(e) => setFormData({ ...formData, rent_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Buy Price (RWF)</Label>
                  <Input 
                    type="number"
                    value={formData.buy_price}
                    onChange={(e) => setFormData({ ...formData, buy_price: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Deposit (RWF)</Label>
                  <Input 
                    type="number"
                    value={formData.deposit}
                    onChange={(e) => setFormData({ ...formData, deposit: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>SKU</Label>
                  <Input 
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Stock Quantity</Label>
                  <Input 
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Discount %</Label>
                  <Input 
                    type="number"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Brand</Label>
                  <Input 
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Model</Label>
                  <Input 
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Year Manufactured</Label>
                  <Input 
                    type="number"
                    value={formData.year_manufactured}
                    onChange={(e) => setFormData({ ...formData, year_manufactured: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Warranty (months)</Label>
                  <Input 
                    type="number"
                    value={formData.warranty_period}
                    onChange={(e) => setFormData({ ...formData, warranty_period: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input 
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Dimensions (LxWxH)</Label>
                  <Input 
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    placeholder="e.g., 100x50x30 cm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  value={newFeature}
                  onChange={(e) => setNewFeature(e.target.value)}
                  placeholder="Add feature"
                />
                <Button type="button" onClick={addFeature}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.features.map((feature, i) => (
                  <Badge key={i} variant="secondary">
                    {feature}
                    <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeFeature(i)} />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Attributes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input 
                  value={newAttribute.name}
                  onChange={(e) => setNewAttribute({ ...newAttribute, name: e.target.value })}
                  placeholder="Attribute name"
                />
                <Input 
                  value={newAttribute.value}
                  onChange={(e) => setNewAttribute({ ...newAttribute, value: e.target.value })}
                  placeholder="Attribute value"
                />
                <Button type="button" onClick={addAttribute}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                {formData.attributes.map((attr, i) => (
                  <div key={i} className="flex items-center justify-between p-2 border rounded">
                    <span><strong>{attr.name}:</strong> {attr.value}</span>
                    <X className="h-4 w-4 cursor-pointer" onClick={() => removeAttribute(i)} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <Label>Address *</Label>
              <Input 
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO & Marketing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>SEO Title</Label>
                <Input 
                  value={formData.seo_title}
                  onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                />
              </div>
              <div>
                <Label>SEO Description</Label>
                <Textarea 
                  value={formData.seo_description}
                  onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label>Featured Product</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" size="lg" disabled={loading} className="flex-1">
              <Save className="h-5 w-5 mr-2" />
              {loading ? 'Saving...' : (productId ? 'Update Product' : 'Create Product')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
