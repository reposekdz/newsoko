import { PackageOpen, Search, Plus, TrendingUp, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';

export function EmptyState({ type = 'products', onAction }: { type?: string; onAction?: () => void }) {
  const configs = {
    products: {
      icon: PackageOpen,
      title: 'Nta bintu bihari',
      description: 'Ntabintu byabonetse muri iki cyiciro. Gerageza gushakisha ikindi kintu cyangwa wongere filter.',
      action: 'Shakisha ikindi',
      suggestions: ['Gerageza gushakisha amagambo atandukanye', 'Kuramo filter zimwe', 'Reba ibindi byiciro']
    },
    search: {
      icon: Search,
      title: 'Nta bisubizo byabonetse',
      description: 'Ntabintu byahuye n\'ishakisha ryawe. Gerageza amagambo atandukanye.',
      action: 'Shakisha ikindi',
      suggestions: ['Koresha amagambo yoroshye', 'Reba spelling', 'Gerageza category zitandukanye']
    },
    favorites: {
      icon: PackageOpen,
      title: 'Nta bintu wishimiye',
      description: 'Ntabintu wongeyeho muri favorites. Kanda heart icon ku bintu ukunda.',
      action: 'Reba ibintu',
      suggestions: ['Shakisha ibintu bishya', 'Reba trending products', 'Reba featured items']
    }
  };

  const config = configs[type] || configs.products;
  const Icon = config.icon;

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-2xl w-full border-2 border-dashed">
        <CardContent className="p-12 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-2xl font-bold">{config.title}</h3>
            <p className="text-muted-foreground max-w-md mx-auto">{config.description}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={onAction}>
              <Search className="h-4 w-4 mr-2" />
              {config.action}
            </Button>
            <Button size="lg" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Tanga ikintu
            </Button>
          </div>

          <div className="pt-6 border-t">
            <p className="text-sm font-medium mb-3">Amabwiriza:</p>
            <div className="grid gap-2 text-sm text-muted-foreground">
              {config.suggestions.map((suggestion, i) => (
                <div key={i} className="flex items-center gap-2 justify-center">
                  <Sparkles className="h-3 w-3 text-primary" />
                  <span>{suggestion}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
