import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Users, ShieldAlert, Package, DollarSign, AlertTriangle, Settings, Activity, TrendingUp } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function AdvancedAdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [dashboardData, usersData] = await Promise.all([
        api.getAdminDashboard(),
        api.getAdminUsers('all', '', 20, 0)
      ]);
      
      if (dashboardData.success) setStats(dashboardData.data);
      if (usersData.success) setUsers(usersData.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId: number, reason: string) => {
    try {
      const result = await api.toggleUserBan(userId, reason);
      if (result.success) {
        toast.success('User status updated');
        loadDashboard();
      }
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex gap-2">
          <Button variant={activeTab === 'overview' ? 'default' : 'outline'} onClick={() => setActiveTab('overview')}>Overview</Button>
          <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>Users</Button>
          <Button variant={activeTab === 'settings' ? 'default' : 'outline'} onClick={() => setActiveTab('settings')}>Settings</Button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold">{stats?.total_users || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Products</p>
                    <p className="text-2xl font-bold">{stats?.pending_products || 0}</p>
                  </div>
                  <Package className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Open Disputes</p>
                    <p className="text-2xl font-bold">{stats?.open_disputes || 0}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue (30d)</p>
                    <p className="text-2xl font-bold">{(stats?.revenue_30d || 0).toLocaleString()} RWF</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5" />
                  Fraud Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium">High Risk Transactions</span>
                    <Badge variant="destructive">{stats?.fraud_alerts || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Verified Sellers</span>
                    <span className="font-bold">{stats?.verified_sellers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Active Bookings</span>
                    <span className="font-bold">{stats?.active_bookings || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Pending Verifications</span>
                    <span className="font-bold">{stats?.pending_verifications || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>User Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex gap-2 mt-1">
                      {user.is_verified && <Badge variant="default">Verified</Badge>}
                      {user.is_banned && <Badge variant="destructive">Banned</Badge>}
                      {user.is_admin && <Badge variant="secondary">Admin</Badge>}
                    </div>
                  </div>
                  <Button
                    variant={user.is_banned ? 'default' : 'destructive'}
                    size="sm"
                    onClick={() => handleToggleBan(user.id, 'Admin action')}
                  >
                    {user.is_banned ? 'Unban' : 'Ban'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Platform Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Settings management coming soon...</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
