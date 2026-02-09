import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from 'next-themes';
import { Toaster } from './components/ui/sonner';
import { AppProvider } from '../context/AppContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { AdvancedHeader } from './components/navigation/AdvancedHeader';
import { BottomNav } from './components/navigation/BottomNav';
import { HomePage } from './components/pages/HomePage';
import { SearchPage } from './components/pages/SearchPage';
import { AddListingPage } from './components/pages/AddListingPage';
import { InboxPage } from './components/pages/InboxPage';
import { ProfilePage } from './components/pages/ProfilePage';
import { SuperAdminDashboard } from './components/pages/SuperAdminDashboard';
import { DashboardPage } from './components/pages/DashboardPage';
import { AdvancedProductApproval } from './components/pages/AdvancedProductApproval';
import { FraudDetectionDashboard } from './components/pages/FraudDetectionDashboard';
import { WalletCheckout } from './components/payment/WalletCheckout';
import { EscrowProgressTracker } from './components/payment/EscrowProgressTracker';
import { InstantPayoutSetup } from './components/payment/InstantPayoutSetup';
import { LivePhotoVerification } from './components/seller/LivePhotoVerification';
import { AdvancedSellerVerification } from './components/seller/AdvancedSellerVerification';
import { ShippingTracker } from './components/shipping/ShippingTracker';
import { ModernAuthDialog } from './components/auth/ModernAuthDialog';
import '../i18n/config';

function AppContent() {
  const { i18n } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('home');
  const [searchFilters, setSearchFilters] = useState({});
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  useEffect(() => {
    i18n.changeLanguage('rw');
  }, [i18n]);

  const renderPage = () => {
    switch (activeTab) {
      case 'home':
        return <HomePage />;
      case 'search':
        return <SearchPage filters={searchFilters} />;
      case 'add':
        return <AddListingPage />;
      case 'inbox':
        return <InboxPage />;
      case 'profile':
        return <ProfilePage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'admin':
        return user?.is_admin ? <SuperAdminDashboard /> : <HomePage />;
      case 'product-approval':
        return user?.is_admin ? <AdvancedProductApproval /> : <HomePage />;
      case 'fraud-detection':
        return user?.is_admin ? <FraudDetectionDashboard /> : <HomePage />;
      case 'seller-verification':
        return <AdvancedSellerVerification />;
      case 'live-photo':
        return <LivePhotoVerification productId={1} />;
      case 'payout-setup':
        return <InstantPayoutSetup />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdvancedHeader 
        onSearch={(filters) => { setSearchFilters(filters); setActiveTab('search'); }} 
        onShowAuth={() => setShowAuthDialog(true)}
        onCategorySelect={(category) => { setSearchFilters({ category }); setActiveTab('search'); }}
        onAdminClick={() => setActiveTab('admin')}
        onDashboardClick={() => setActiveTab('dashboard')}
      />
      <ModernAuthDialog open={showAuthDialog} onClose={() => setShowAuthDialog(false)} />
      
      <main className="pb-20 md:pb-0">
        {renderPage()}
      </main>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} messageCount={5} />
      <Toaster />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
