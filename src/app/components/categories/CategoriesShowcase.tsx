import { Car, Wrench, HardHat, Package, Hammer, Zap, Home, Shirt, Sofa, Settings } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';

export function CategoriesShowcase({ onSelectCategory }: { onSelectCategory: (category: string) => void }) {
  const categories = [
    { id: 'vehicles', name: 'Imodoka', icon: Car, count: '150+', color: 'bg-blue-500' },
    { id: 'spare_parts', name: 'Spare Parts', icon: Wrench, count: '500+', color: 'bg-orange-500', featured: true },
    { id: 'construction', name: 'Construction', icon: HardHat, count: '300+', color: 'bg-yellow-500', featured: true },
    { id: 'building_materials', name: 'Building Materials', icon: Package, count: '400+', color: 'bg-green-500', featured: true },
    { id: 'machinery', name: 'Machinery', icon: Settings, count: '80+', color: 'bg-purple-500', featured: true },
    { id: 'tools', name: 'Tools', icon: Hammer, count: '200+', color: 'bg-red-500' },
    { id: 'electronics', name: 'Electronics', icon: Zap, count: '180+', color: 'bg-cyan-500' },
    { id: 'houses', name: 'Amazu', icon: Home, count: '90+', color: 'bg-indigo-500' },
    { id: 'clothing', name: 'Imyenda', icon: Shirt, count: '120+', color: 'bg-pink-500' },
    { id: 'furniture', name: 'Ibikoresho', icon: Sofa, count: '100+', color: 'bg-teal-500' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ibiciro byose</h2>
        <Badge variant="secondary">10 Categories</Badge>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.id} className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 border-2 hover:border-primary relative overflow-hidden" onClick={() => onSelectCategory(category.id)}>
              {category.featured && <Badge className="absolute top-2 right-2 text-xs">New</Badge>}
              <CardContent className="p-6 text-center space-y-3">
                <div className={`h-16 w-16 rounded-full ${category.color} bg-opacity-10 flex items-center justify-center mx-auto`}>
                  <Icon className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{category.name}</h3>
                  <p className="text-xs text-muted-foreground">{category.count} items</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
