import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { AlertTriangle, MessageSquare, CheckCircle } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function AdminDisputeResolution() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [filter, setFilter] = useState('open');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDisputes();
  }, [filter]);

  const loadDisputes = async () => {
    try {
      const result = await api.getAdminDisputesComplete();
      if (result.success) {
        const filtered = filter === 'all' ? result.data : result.data.filter((d: any) => d.status === filter);
        setDisputes(filtered);
      }
    } catch (error) {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId: number) => {
    const resolution = prompt('Enter resolution details:');
    if (!resolution) return;
    
    const result = await api.resolveDisputeAdmin(disputeId, resolution);
    if (result.success) {
      toast.success('Dispute resolved');
      loadDisputes();
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">Dispute Resolution</h1>

      <div className="flex gap-2 mb-6">
        <Button variant={filter === 'open' ? 'default' : 'outline'} onClick={() => setFilter('open')}>
          Open ({disputes.filter(d => d.status === 'open').length})
        </Button>
        <Button variant={filter === 'resolved' ? 'default' : 'outline'} onClick={() => setFilter('resolved')}>
          Resolved
        </Button>
        <Button variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
          All
        </Button>
      </div>

      <div className="grid gap-4">
        {disputes.map((dispute) => (
          <Card key={dispute.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Dispute #{dispute.id}
                </CardTitle>
                <Badge variant={dispute.status === 'open' ? 'destructive' : 'default'}>
                  {dispute.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Filed By</p>
                    <p className="text-sm text-muted-foreground">{dispute.raised_by_name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Against</p>
                    <p className="text-sm text-muted-foreground">{dispute.against_name}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium">Product</p>
                  <p className="text-sm text-muted-foreground">{dispute.product_title}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Reason</p>
                  <p className="text-sm text-muted-foreground">{dispute.reason}</p>
                </div>

                <div>
                  <p className="text-sm font-medium">Description</p>
                  <p className="text-sm">{dispute.description}</p>
                </div>

                {dispute.evidence && (
                  <div>
                    <p className="text-sm font-medium mb-2">Evidence</p>
                    <div className="grid grid-cols-4 gap-2">
                      {JSON.parse(dispute.evidence).map((img: string, idx: number) => (
                        <img key={idx} src={img} alt={`Evidence ${idx + 1}`} className="w-full h-20 object-cover rounded" />
                      ))}
                    </div>
                  </div>
                )}

                {dispute.resolution && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-green-900">Resolution</p>
                    <p className="text-sm text-green-800">{dispute.resolution}</p>
                    <p className="text-xs text-green-700 mt-2">
                      Resolved on {new Date(dispute.resolved_at).toLocaleString()}
                    </p>
                  </div>
                )}

                {dispute.status === 'open' && (
                  <div className="flex gap-2 pt-4 border-t">
                    <Button onClick={() => handleResolve(dispute.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Resolve Dispute
                    </Button>
                    <Button variant="outline">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Parties
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {disputes.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No disputes found
          </CardContent>
        </Card>
      )}
    </div>
  );
}
