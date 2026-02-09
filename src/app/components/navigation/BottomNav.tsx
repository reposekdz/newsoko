import { Home, Search, PlusCircle, MessageSquare, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../ui/utils';
import { Badge } from '../ui/badge';

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  messageCount?: number;
}

export function BottomNav({ activeTab, onTabChange, messageCount = 0 }: BottomNavProps) {
  const { t } = useTranslation();

  const tabs = [
    { key: 'home', icon: Home, label: t('home') },
    { key: 'search', icon: Search, label: t('search') },
    { key: 'add', icon: PlusCircle, label: t('uploadProduct'), special: true },
    { key: 'dashboard', icon: MessageSquare, label: 'Dashboard' },
    { key: 'profile', icon: User, label: t('profile') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;

          return (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 px-3 py-1 rounded-lg transition-colors min-w-[60px]',
                isActive ? 'text-primary' : 'text-muted-foreground',
                tab.special && 'relative'
              )}
            >
              {tab.special ? (
                <div className="flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Icon className="h-6 w-6" />
                </div>
              ) : (
                <div className="relative">
                  <Icon className={cn('h-6 w-6', isActive && 'fill-primary')} />
                  {tab.badge && tab.badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center bg-destructive text-[8px]">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </Badge>
                  )}
                </div>
              )}
              <span className={cn('text-xs', tab.special && 'mt-2')}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
