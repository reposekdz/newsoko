import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Search, Bell, Trash2, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function SavedSearches() {
  const [searches, setSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const fetchSavedSearches = async () => {
    setLoading(true);
    try {
      const result = await api.getSavedSearches();
      if (result.success) {
        setSearches(result.saved_searches);
      }
    } catch (error) {
      toast({ title: 'Failed to load saved searches', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const deleteSearch = async (searchId: number) => {
    try {
      const result = await api.delete('/wishlist.php', { search_id: searchId });
      if (result.success) {
        toast({ title: 'Search deleted' });
        fetchSavedSearches();
      }
    } catch (error) {
      toast({ title: 'Failed to delete search', variant: 'destructive' });
    }
  };

  const getSearchSummary = (params: any) => {
    const parts = [];
    if (params.query) parts.push(`"${params.query}"`);
    if (params.category) parts.push(params.category);
    if (params.min_price) parts.push(`Min: ${params.min_price} RWF`);
    if (params.max_price) parts.push(`Max: ${params.max_price} RWF`);
    return parts.join(' • ') || 'All products';
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
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Saved Searches ({searches.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {searches.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No saved searches</p>
            <p className="text-sm mt-1">Save your searches to get alerts for new listings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {searches.map((search) => (
              <Card key={search.id} className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">{search.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getSearchSummary(JSON.parse(search.search_params))}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSearch(search.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4" />
                      <Label htmlFor={`alert-${search.id}`}>Email Alerts</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id={`alert-${search.id}`}
                        checked={search.alert_enabled}
                      />
                      {search.alert_enabled && (
                        <Badge variant="outline">{search.alert_frequency}</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1">
                      <Search className="h-4 w-4 mr-2" />
                      Search Now
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(search.created_at).toLocaleDateString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
