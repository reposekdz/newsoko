import { Search, Bell, Heart, User, Menu, ShoppingBag, MessageSquare, Plus, LogOut, Settings, Wallet, Package, TrendingUp, MapPin, Globe, Moon, Sun, Filter, History, Bookmark } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel } from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from 'next-themes';
import { api } from '../../../services/api';
import { t } from '../../../utils/translations';

export function AdvancedHeader({ onSearch, onShowAuth, onCategorySelect, onAdminClick, onDashboardClick }: any) {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('all');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      loadSearchHistory();
    }
  }, [isAuthenticated]);

  const loadNotifications = async () => {
    const response = await api.getNotifications();
    if (response.success) {
      setNotifications(response.data);
      setUnreadCount(response.unread_count);
    }
  };

  const loadSearchHistory = () => {
    const history = localStorage.getItem('search_history');
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const history = [searchQuery, ...searchHistory.filter(h => h !== searchQuery)].slice(0, 10);
      localStorage.setItem('search_history', JSON.stringify(history));
      setSearchHistory(history);
      onSearch({ query: searchQuery, category: searchCategory !== 'all' ? searchCategory : null });
      setShowSearchSuggestions(false);
    }
  };

  const quickCategories = [
    { id: 'vehicles', name: 'Imodoka', icon: ShoppingBag },
    { id: 'electronics', name: 'Electronics', icon: Settings },
    { id: 'real-estate', name: 'Amazu', icon: Package },
    { id: 'furniture', name: 'Furniture', icon: Package },
    { id: 'clothing', name: 'Imyenda', icon: ShoppingBag },
    { id: 'construction', name: 'Construction', icon: Package },
    { id: 'spare-parts', name: 'Spare Parts', icon: Settings },
    { id: 'machinery', name: 'Machinery', icon: Settings },
    { id: 'tools', name: 'Tools', icon: Settings },
    { id: 'sports', name: 'Sports', icon: Package },
    { id: 'books', name: 'Books', icon: Package },
    { id: 'beauty', name: 'Beauty', icon: ShoppingBag },
    { id: 'jewelry', name: 'Jewelry', icon: ShoppingBag },
    { id: 'toys', name: 'Toys', icon: Package },
    { id: 'garden', name: 'Garden', icon: Package },
    { id: 'pets', name: 'Pets', icon: Package },
    { id: 'music', name: 'Music', icon: Package },
    { id: 'office', name: 'Office', icon: Package },
    { id: 'health', name: 'Health', icon: Package },
    { id: 'baby', name: 'Baby', icon: Package },
    { id: 'food', name: 'Food', icon: Package },
    { id: 'art', name: 'Art', icon: Package },
    { id: 'photography', name: 'Photography', icon: Package },
    { id: 'gaming', name: 'Gaming', icon: Package },
    { id: 'appliances', name: 'Appliances', icon: Package },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex h-9 items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Kigali, Rwanda</span>
              </div>
              <div className="hidden md:flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">24/7 Support</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </Button>
              {!isAuthenticated && (
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={onShowAuth}>
                  Injira / Iyandikishe
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center gap-4">
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Isoko
              </span>
              <p className="text-[10px] text-muted-foreground leading-none">Rwanda Marketplace</p>
            </div>
          </div>

          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="flex gap-2">
              <Select value={searchCategory} onValueChange={setSearchCategory}>
                <SelectTrigger className="w-[130px] h-10 border-2 border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Byose</SelectItem>
                  <SelectItem value="vehicles">Imodoka</SelectItem>
                  <SelectItem value="electronics">Electronics</SelectItem>
                  <SelectItem value="real-estate">Amazu</SelectItem>
                  <SelectItem value="furniture">Furniture</SelectItem>
                  <SelectItem value="clothing">Imyenda</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="spare-parts">Spare Parts</SelectItem>
                  <SelectItem value="machinery">Machinery</SelectItem>
                  <SelectItem value="tools">Tools</SelectItem>
                  <SelectItem value="sports">Sports</SelectItem>
                  <SelectItem value="books">Books</SelectItem>
                  <SelectItem value="beauty">Beauty</SelectItem>
                  <SelectItem value="jewelry">Jewelry</SelectItem>
                  <SelectItem value="toys">Toys</SelectItem>
                  <SelectItem value="garden">Garden</SelectItem>
                  <SelectItem value="pets">Pets</SelectItem>
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="health">Health</SelectItem>
                  <SelectItem value="baby">Baby</SelectItem>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="art">Art</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="appliances">Appliances</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Shakisha imodoka, spare parts..."
                  className="pl-10 pr-24 h-10 border-2 border-primary/20 focus:border-primary rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full h-8 px-4"
                  onClick={handleSearch}
                >
                  Shakisha
                </Button>

                {showSearchSuggestions && searchHistory.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-background border rounded-lg shadow-lg p-2 z-50">
                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                      <History className="h-3 w-3" />
                      <span>Recent Searches</span>
                    </div>
                    {searchHistory.slice(0, 5).map((item, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 hover:bg-muted rounded cursor-pointer text-sm"
                        onClick={() => {
                          setSearchQuery(item);
                          handleSearch();
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0 ml-auto">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="relative hidden lg:flex h-9 w-9">
                  <Bookmark className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                    {user?.favorites_count || 0}
                  </Badge>
                </Button>
                
                <Button variant="ghost" size="icon" className="relative hidden lg:flex h-9 w-9">
                  <Heart className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">3</Badge>
                </Button>
                
                <Button variant="ghost" size="icon" className="relative hidden lg:flex h-9 w-9">
                  <MessageSquare className="h-4 w-4" />
                  <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">5</Badge>
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative h-9 w-9">
                      <Bell className="h-4 w-4" />
                      {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                          {unreadCount}
                        </Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80">
                    <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {notifications.slice(0, 5).map((notif: any) => (
                      <DropdownMenuItem key={notif.id} className="flex flex-col items-start p-3">
                        <span className="font-medium">{notif.title}</span>
                        <span className="text-xs text-muted-foreground">{notif.message}</span>
                      </DropdownMenuItem>
                    ))}
                    {notifications.length === 0 && (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        Nta notification zihari
                      </div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="default" size="sm" className="hidden lg:flex gap-1.5 h-9 px-3">
                  <Plus className="h-4 w-4" />
                  <span className="text-sm">Tanga</span>
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user?.name}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span className="text-sm" onClick={onDashboardClick}>Dashboard</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Wallet className="mr-2 h-4 w-4" />
                      <span className="text-sm">Wallet: {user?.wallet_balance?.toLocaleString()} RWF</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Package className="mr-2 h-4 w-4" />
                      <span className="text-sm">Ibyo natanze</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      <span className="text-sm">Ibyo nakodesheje</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Heart className="mr-2 h-4 w-4" />
                      <span className="text-sm">Favorites</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      <span className="text-sm">Settings</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span className="text-sm">Sohoka</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" size="sm" onClick={onShowAuth} className="hidden sm:flex h-9">
                  Injira
                </Button>
                <Button size="sm" onClick={onShowAuth} className="h-9">
                  Iyandikishe
                </Button>
              </>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[400px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b bg-primary/5">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <span className="text-lg font-bold">Isoko</span>
                        <p className="text-xs text-muted-foreground">Rwanda Marketplace</p>
                      </div>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder={t('search')}
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                      />
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {isAuthenticated ? (
                      <>
                        <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={user?.avatar} />
                              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-bold">{user?.name}</p>
                              <p className="text-xs text-muted-foreground">{user?.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-2 bg-background rounded">
                            <span className="text-sm">Wallet</span>
                            <span className="font-bold text-primary">{user?.wallet_balance?.toLocaleString() || 0} RWF</span>
                          </div>
                        </div>

                        <Button className="w-full justify-start gap-2" onClick={() => { onDashboardClick(); setMobileMenuOpen(false); }}>
                          <TrendingUp className="h-4 w-4" />
                          Dashboard
                        </Button>
                        
                        <Button className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                          <Plus className="h-4 w-4" />
                          {t('addProduct')}
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                          <Package className="h-4 w-4" />
                          Ibyo natanze
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                          <Heart className="h-4 w-4" />
                          Favorites
                          <Badge className="ml-auto">3</Badge>
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                          <MessageSquare className="h-4 w-4" />
                          Messages
                          <Badge className="ml-auto">5</Badge>
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                          <Bell className="h-4 w-4" />
                          Notifications
                          {unreadCount > 0 && <Badge className="ml-auto">{unreadCount}</Badge>}
                        </Button>
                        
                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setMobileMenuOpen(false)}>
                          <Settings className="h-4 w-4" />
                          Settings
                        </Button>
                        
                        <div className="my-4 border-t" />
                        
                        <Button variant="outline" className="w-full justify-start gap-2 text-red-600" onClick={() => { logout(); setMobileMenuOpen(false); }}>
                          <LogOut className="h-4 w-4" />
                          {t('logout')}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button onClick={() => { onShowAuth(); setMobileMenuOpen(false); }} className="w-full">
                          {t('login')}
                        </Button>
                        <Button onClick={() => { onShowAuth(); setMobileMenuOpen(false); }} variant="outline" className="w-full">
                          {t('register')}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
