import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Activity, ShoppingBag, MessageSquare, Star, AlertCircle, User, Loader2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function ActivityTimeline() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const result = await api.getUserActivity(50);
      if (result.success) {
        setActivities(result.activities || []);
      }
    } catch (error) {
      toast({ title: 'Failed to load activity', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'booking': return <ShoppingBag className="h-5 w-5" />;
      case 'message': return <MessageSquare className="h-5 w-5" />;
      case 'review': return <Star className="h-5 w-5" />;
      case 'dispute': return <AlertCircle className="h-5 w-5" />;
      case 'profile': return <User className="h-5 w-5" />;
      default: return <Activity className="h-5 w-5" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'booking': return 'bg-blue-500';
      case 'message': return 'bg-green-500';
      case 'review': return 'bg-yellow-500';
      case 'dispute': return 'bg-red-500';
      case 'profile': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
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
          <Activity className="h-5 w-5" />
          Activity Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>No activity yet</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            
            <div className="space-y-6">
              {activities.map((activity) => (
                <div key={activity.id} className="relative flex items-start gap-4">
                  <div className={`relative z-10 flex items-center justify-center w-12 h-12 rounded-full ${getActivityColor(activity.activity_type)} text-white`}>
                    {getActivityIcon(activity.activity_type)}
                  </div>
                  
                  <div className="flex-1 pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline">{activity.activity_type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(activity.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
