import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Bell, Check, CheckCheck, Trash2, X } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function NotificationsCenter() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      const result = await api.getNotifications(filter === 'unread');
      if (result.success) {
        setNotifications(result.notifications);
        setUnreadCount(result.unread_count);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId?: number) => {
    try {
      const result = await api.markNotificationRead(notificationId);
      if (result.success) {
        fetchNotifications();
        toast({ title: 'Marked as read' });
      }
    } catch (error) {
      toast({ title: 'Failed to mark as read', variant: 'destructive' });
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      const result = await api.deleteNotification(notificationId);
      if (result.success) {
        fetchNotifications();
        toast({ title: 'Notification deleted' });
      }
    } catch (error) {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge className="bg-red-500">{unreadCount}</Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
              All
            </Button>
            <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')}>
              Unread
            </Button>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={() => markAsRead()}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border ${!notification.is_read ? 'bg-primary/5 border-primary/20' : 'bg-secondary/30'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
                      <h4 className="font-semibold">{notification.title}</h4>
                      <Badge variant="outline" className="text-xs">{notification.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {!notification.is_read && (
                      <Button variant="ghost" size="sm" onClick={() => markAsRead(notification.id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => deleteNotification(notification.id)}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
