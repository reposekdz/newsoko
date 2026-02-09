import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Upload, X, Plus, Package, DollarSign, Calendar, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { LocationSelector } from '../shared/LocationSelector';

const API_URL = 'http://localhost/Rentalsalesmarketplace/api/controllers';

export function AdvancedProductUpload() {
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([]);
  const [tags, setTags] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    condition: 'good',
    rent_price: '',
    buy_price: '',
    deposit: '',
    address: '',
    province_id: undefined,
    district_id: undefined,
    sector_id: undefined,
    stock_quantity: 1,
    min_rental_days: 1,
    max_rental_days: 365,
    features: []
  });

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map(file => URL.createObjectURL(file));
    setImages([...images, ...newImages]);
  };

  const addVariant = () => {
    setVariants([...variants, { name: '', value: '', price_adjustment: 0, stock: 0 }]);
  };

  const updateVariant = (index, field, value) => {
    const updated = [...variants];
    updated[index][field] = value;
    setVariants(updated);
  };

  const removeVariant = (index) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const addTag = (tag) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_URL}/product_management.php`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'create_product',
          ...formData,
          images,
          variants,
          tags
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Product created successfully!');
        // Reset form
        setFormData({
          title: '',
          description: '',
          category: '',
          condition: 'good',
          rent_price: '',
          buy_price: '',
          deposit: '',
          address: '',
          province_id: undefined,
          district_id: undefined,
          sector_id: undefined,
          stock_quantity: 1,
          min_rental_days: 1,
          max_rental_days: 365,
          features: []
        });
        setImages([]);
        setVariants([]);
        setTags([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to create product');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Upload New Product</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="variants">Variants</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label>Product Images</Label>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  {images.map((img, i) => (
                    <div key={i} className="relative aspect-square border rounded-lg overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-6 w-6"
                        onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-secondary/50">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <span className="text-sm">Upload</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div>
                <Label>Title</Label>
                <Input value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} placeholder="Product name" />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={4} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vehicles">Vehicles</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="clothing">Clothing</SelectItem>
                      <SelectItem value="houses">Houses</SelectItem>
                      <SelectItem value="furniture">Furniture</SelectItem>
                      <SelectItem value="tools">Tools</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Condition</Label>
                  <Select value={formData.condition} onValueChange={(v) => setFormData({...formData, condition: v})}>
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
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Rent Price (per day)</Label>
                  <Input type="number" value={formData.rent_price} onChange={(e) => setFormData({...formData, rent_price: e.target.value})} />
                </div>
                <div>
                  <Label>Buy Price</Label>
                  <Input type="number" value={formData.buy_price} onChange={(e) => setFormData({...formData, buy_price: e.target.value})} />
                </div>
              </div>

              <div>
                <Label>Security Deposit</Label>
                <Input type="number" value={formData.deposit} onChange={(e) => setFormData({...formData, deposit: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Min Rental Days</Label>
                  <Input type="number" value={formData.min_rental_days} onChange={(e) => setFormData({...formData, min_rental_days: e.target.value})} />
                </div>
                <div>
                  <Label>Max Rental Days</Label>
                  <Input type="number" value={formData.max_rental_days} onChange={(e) => setFormData({...formData, max_rental_days: e.target.value})} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="variants" className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Product Variants</Label>
                <Button onClick={addVariant} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              </div>

              {variants.map((variant, i) => (
                <Card key={i}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-4 gap-4">
                      <Input placeholder="Name (e.g., Size)" value={variant.name} onChange={(e) => updateVariant(i, 'name', e.target.value)} />
                      <Input placeholder="Value (e.g., Large)" value={variant.value} onChange={(e) => updateVariant(i, 'value', e.target.value)} />
                      <Input type="number" placeholder="Price +" value={variant.price_adjustment} onChange={(e) => updateVariant(i, 'price_adjustment', e.target.value)} />
                      <div className="flex gap-2">
                        <Input type="number" placeholder="Stock" value={variant.stock} onChange={(e) => updateVariant(i, 'stock', e.target.value)} />
                        <Button variant="destructive" size="icon" onClick={() => removeVariant(i)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <div>
                <Label>Stock Quantity</Label>
                <Input type="number" value={formData.stock_quantity} onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})} />
              </div>

              <div>
                <Label>Location</Label>
                <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Address" />
              </div>

              <LocationSelector 
                value={{
                  province_id: formData.province_id,
                  district_id: formData.district_id,
                  sector_id: formData.sector_id
                }}
                onChange={(location) => setFormData({...formData, ...location})}
                required
              />

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setTags(tags.filter((_, idx) => idx !== i))} />
                    </Badge>
                  ))}
                </div>
                <Input placeholder="Add tag and press Enter" onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addTag(e.target.value);
                    e.target.value = '';
                  }
                }} />
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex gap-4">
            <Button onClick={handleSubmit} className="flex-1">
              <Package className="h-4 w-4 mr-2" />
              Create Product
            </Button>
            <Button variant="outline">Save as Draft</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
