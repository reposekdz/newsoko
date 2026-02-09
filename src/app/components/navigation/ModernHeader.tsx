import { Search, Bell, Heart, User, Menu, ShoppingBag, MessageSquare, Plus, LogOut, Settings, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { useAuth } from '../../../context/AuthContext';

export function ModernHeader({ onSearch, onShowAuth }: any) {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      onSearch(searchQuery);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Isoko
              </span>
            </div>
          </div>

          <div className="flex-1 max-w-2xl hidden md:block">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Shakisha imodoka, inzu, laptop, imyenda..."
                className="pl-12 pr-4 h-12 border-2 border-primary/20 focus:border-primary rounded-full shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                onClick={handleSearch}
              >
                Shakisha
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                  <Heart className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">3</Badge>
                </Button>
                
                <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                  <MessageSquare className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">5</Badge>
                </Button>
                
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">2</Badge>
                </Button>

                <Button variant="default" size="sm" className="hidden sm:flex gap-2">
                  <Plus className="h-4 w-4" />
                  Tanga
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar>
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center gap-2 p-2">
                      <Avatar>
                        <AvatarImage src={user?.avatar} />
                        <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user?.name}</span>
                        <span className="text-xs text-muted-foreground">{user?.email}</span>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Wallet className="mr-2 h-4 w-4" />
                      Wallet: {user?.wallet_balance?.toLocaleString()} RWF
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ShoppingBag className="mr-2 h-4 w-4" />
                      Ibyo natanze
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Heart className="mr-2 h-4 w-4" />
                      Favorites
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sohoka
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={onShowAuth} className="hidden sm:flex">
                  Injira
                </Button>
                <Button onClick={onShowAuth}>
                  Iyandikishe
                </Button>
              </>
            )}

            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col gap-4 mt-8">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Shakisha..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  {isAuthenticated ? (
                    <>
                      <Button className="w-full justify-start gap-2">
                        <Plus className="h-4 w-4" />
                        Tanga ikintu
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Heart className="h-4 w-4" />
                        Favorites
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Messages
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
                        <LogOut className="h-4 w-4" />
                        Sohoka
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={onShowAuth} className="w-full">Injira</Button>
                      <Button onClick={onShowAuth} variant="outline" className="w-full">Iyandikishe</Button>
                    </>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
