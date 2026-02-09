import { Search, SlidersHorizontal, MapPin, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Badge } from '../ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';

export function AdvancedSearchBar({ onSearch, initialFilters = {} }: any) {
  const [query, setQuery] = useState(initialFilters.query || '');
  const [category, setCategory] = useState(initialFilters.category || 'all');
  const [priceRange, setPriceRange] = useState(initialFilters.priceRange || [0, 10000000]);
  const [condition, setCondition] = useState(initialFilters.condition || 'all');
  const [location, setLocation] = useState(initialFilters.location || '');
  const [sortBy, setSortBy] = useState(initialFilters.sortBy || 'newest');
  const [showFilters, setShowFilters] = useState(false);

  const activeFiltersCount = [category !== 'all', condition !== 'all', location, sortBy !== 'newest'].filter(Boolean).length;

  const handleSearch = () => {
    onSearch({
      query,
      category: category !== 'all' ? category : null,
      min_price: priceRange[0],
      max_price: priceRange[1],
      condition: condition !== 'all' ? condition : null,
      location,
      sort: sortBy
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setCategory('all');
    setPriceRange([0, 10000000]);
    setCondition('all');
    setLocation('');
    setSortBy('newest');
    onSearch({ query });
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input placeholder="Shakisha imodoka, inzu, laptop..." className="pl-10 h-12" value={query} onChange={(e) => setQuery(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} />
        </div>
        
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" size="lg" className="relative">
              <SlidersHorizontal className="h-5 w-5 mr-2" />
              Filters
              {activeFiltersCount > 0 && <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{activeFiltersCount}</Badge>}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader><SheetTitle>Advanced Filters</SheetTitle></SheetHeader>
            
            <div className="space-y-6 mt-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Icyiciro</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Byose</SelectItem>
                    <SelectItem value="vehicles">Imodoka</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="houses">Amazu</SelectItem>
                    <SelectItem value="clothing">Imyenda</SelectItem>
                    <SelectItem value="furniture">Ibikoresho</SelectItem>
                    <SelectItem value="tools">Tools</SelectItem>
                    <SelectItem value="spare_parts">Spare Parts</SelectItem>
                    <SelectItem value="construction">Construction</SelectItem>
                    <SelectItem value="building_materials">Building Materials</SelectItem>
                    <SelectItem value="machinery">Machinery</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Igiciro: {priceRange[0].toLocaleString()} - {priceRange[1].toLocaleString()} RWF</label>
                <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={10000000} step={50000} className="mt-2" />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Imiterere</label>
                <Select value={condition} onValueChange={setCondition}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Byose</SelectItem>
                    <SelectItem value="new">Gishya</SelectItem>
                    <SelectItem value="like-new">Nk'igishya</SelectItem>
                    <SelectItem value="good">Nziza</SelectItem>
                    <SelectItem value="fair">Isanzwe</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Ahantu</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Kigali, Gasabo..." className="pl-10" value={location} onChange={(e) => setLocation(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Itondekanya</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Bishya</SelectItem>
                    <SelectItem value="price_low">Igiciro: Gito → Kinini</SelectItem>
                    <SelectItem value="price_high">Igiciro: Kinini → Gito</SelectItem>
                    <SelectItem value="popular">Bikunzwe</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleSearch} className="flex-1">Shakisha</Button>
                <Button onClick={clearFilters} variant="outline"><X className="h-4 w-4" /></Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <Button size="lg" onClick={handleSearch}>Shakisha</Button>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex gap-2 flex-wrap">
          {category !== 'all' && <Badge variant="secondary" className="gap-1">{category}<X className="h-3 w-3 cursor-pointer" onClick={() => setCategory('all')} /></Badge>}
          {condition !== 'all' && <Badge variant="secondary" className="gap-1">{condition}<X className="h-3 w-3 cursor-pointer" onClick={() => setCondition('all')} /></Badge>}
          {location && <Badge variant="secondary" className="gap-1">{location}<X className="h-3 w-3 cursor-pointer" onClick={() => setLocation('')} /></Badge>}
        </div>
      )}
    </div>
  );
}
