import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { NotificationsCenter } from '../notifications/NotificationsCenter';
import { WalletManagement } from '../wallet/WalletManagement';
import { WishlistManager } from '../wishlist/WishlistManager';
import { SupportTicketSystem } from '../support/SupportTicketSystem';
import { PaymentAnalyticsDashboard } from '../analytics/PaymentAnalyticsDashboard';
import { ReviewsRatings } from '../reviews/ReviewsRatings';
import { DisputeManagement } from '../disputes/DisputeManagement';
import { ReferralProgram } from '../referrals/ReferralProgram';
import { PromoCodeManager } from '../promo/PromoCodeManager';
import { ProductComparison } from '../comparison/ProductComparison';
import { SavedSearches } from '../search/SavedSearches';
import { SellerPerformanceDashboard } from '../seller/SellerPerformanceDashboard';
import { BookingCalendar } from '../booking/BookingCalendar';
import { ActivityTimeline } from '../user/ActivityTimeline';
import { PlatformAnalyticsDashboard } from '../admin/PlatformAnalyticsDashboard';
import { Bell, Wallet, Heart, MessageSquare, TrendingUp, Star, AlertTriangle, Gift, Tag, GitCompare, Search, Calendar, Activity, BarChart } from 'lucide-react';

export function DashboardPage() {
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:grid-cols-14 mb-6">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden md:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="wallet" className="flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            <span className="hidden md:inline">Wallet</span>
          </TabsTrigger>
          <TabsTrigger value="wishlist" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            <span className="hidden md:inline">Wishlist</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="hidden md:inline">Support</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden md:inline">Analytics</span>
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            <span className="hidden md:inline">Reviews</span>
          </TabsTrigger>
          <TabsTrigger value="disputes" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden md:inline">Disputes</span>
          </TabsTrigger>
          <TabsTrigger value="referrals" className="flex items-center gap-2">
            <Gift className="h-4 w-4" />
            <span className="hidden md:inline">Referrals</span>
          </TabsTrigger>
          <TabsTrigger value="promo" className="flex items-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="hidden md:inline">Promo</span>
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center gap-2">
            <GitCompare className="h-4 w-4" />
            <span className="hidden md:inline">Compare</span>
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">Saved</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span className="hidden md:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span className="hidden md:inline">Calendar</span>
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden md:inline">Activity</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <NotificationsCenter />
        </TabsContent>

        <TabsContent value="wallet">
          <WalletManagement />
        </TabsContent>

        <TabsContent value="wishlist">
          <WishlistManager />
        </TabsContent>

        <TabsContent value="support">
          <SupportTicketSystem />
        </TabsContent>

        <TabsContent value="analytics">
          <PaymentAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="reviews">
          <ReviewsRatings productId={1} sellerId={1} />
        </TabsContent>

        <TabsContent value="disputes">
          <DisputeManagement />
        </TabsContent>

        <TabsContent value="referrals">
          <ReferralProgram />
        </TabsContent>

        <TabsContent value="promo">
          <PromoCodeManager />
        </TabsContent>

        <TabsContent value="comparison">
          <ProductComparison />
        </TabsContent>

        <TabsContent value="saved">
          <SavedSearches />
        </TabsContent>

        <TabsContent value="performance">
          <SellerPerformanceDashboard />
        </TabsContent>

        <TabsContent value="calendar">
          <BookingCalendar productId={1} />
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTimeline />
        </TabsContent>
      </Tabs>
    </div>
  );
}
