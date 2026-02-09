import { Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, FolderTree } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { api } from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

export function CategoriesManagement() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    parent_id: null,
    description: '',
    icon: '',
    sort_order: 0,
    is_active: true
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const response = await api.getAdminCategories();
    if (response.success) setCategories(response.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const response = editingCategory
      ? await api.updateCategory({ ...formData, id: editingCategory.id })
      : await api.createCategory(formData);
    
    if (response.success) {
      loadCategories();
      setShowDialog(false);
      resetForm();
    }
  };

  const handleEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      parent_id: category.parent_id,
      description: category.description,
      icon: category.icon,
      sort_order: category.sort_order,
      is_active: category.is_active
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this category?')) return;
    const response = await api.deleteCategory(id);
    if (response.success) loadCategories();
  };

  const resetForm = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      parent_id: null,
      description: '',
      icon: '',
      sort_order: 0,
      is_active: true
    });
  };

  const mainCategories = categories.filter(c => !c.parent_id);
  const getSubcategories = (parentId: number) => categories.filter(c => c.parent_id === parentId);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FolderTree className="h-8 w-8" />
            Categories Management
          </h1>
          <p className="text-muted-foreground">Manage marketplace categories and subcategories</p>
        </div>
        <Dialog open={showDialog} onOpenChange={(open) => { setShowDialog(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category Name *</Label>
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Slug *</Label>
                  <Input 
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Description</Label>
                <Input 
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Parent Category</Label>
                  <Select 
                    value={formData.parent_id?.toString() || 'none'} 
                    onValueChange={(value) => setFormData({ ...formData, parent_id: value === 'none' ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Main Category)</SelectItem>
                      {mainCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Icon</Label>
                  <Input 
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    placeholder="Lucide icon name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Sort Order</Label>
                  <Input 
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <Switch 
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingCategory ? 'Update' : 'Create'} Category
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {mainCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FolderTree className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={category.is_active ? 'default' : 'secondary'}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline">{category.product_count || 0} products</Badge>
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(category)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(category.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {getSubcategories(category.id).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-2 border rounded-lg hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 bg-secondary rounded flex items-center justify-center">
                        <span className="text-xs">→</span>
                      </div>
                      <span className="text-sm">{sub.name}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleEdit(sub)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(sub.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
