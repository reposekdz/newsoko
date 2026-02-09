import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { AlertTriangle, MessageSquare, Upload, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../../../services/api';
import { toast } from 'sonner';

export function DisputeManagement() {
  const [disputes, setDisputes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFileForm, setShowFileForm] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [formData, setFormData] = useState({
    booking_id: '',
    dispute_type: 'product_not_as_described',
    reason: '',
    description: '',
    evidence: [] as string[]
  });

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const result = await api.getUserDisputes();
      if (result.success) {
        setDisputes(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (disputeId: number) => {
    try {
      const result = await api.getDisputeMessages(disputeId);
      if (result.success) {
        setMessages(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const fileDispute = async () => {
    if (!formData.booking_id || !formData.description) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const result = await api.fileDispute(formData);
      
      if (result.success) {
        toast.success('Dispute filed successfully!');
        setShowFileForm(false);
        fetchDisputes();
        setFormData({
          booking_id: '',
          dispute_type: 'product_not_as_described',
          reason: '',
          description: '',
          evidence: []
        });
      } else {
        toast.error(result.message || 'Failed to file dispute');
      }
    } catch (error) {
      toast.error('Error filing dispute');
    }
  };

  const sendMessage = async () => {
    if (!newMessage || !selectedDispute) return;

    try {
      const result = await api.addDisputeMessage(selectedDispute.id, newMessage);
      
      if (result.success) {
        setNewMessage('');
        fetchMessages(selectedDispute.id);
      } else {
        toast.error(result.message || 'Failed to send message');
      }
    } catch (error) {
      toast.error('Error sending message');
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: any = {
      open: 'bg-blue-500',
      under_review: 'bg-yellow-500',
      resolved: 'bg-green-500',
      closed: 'bg-gray-500'
    };
    return <Badge className={colors[status] || 'bg-gray-500'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Dispute Management
            </span>
            <Button onClick={() => setShowFileForm(true)}>
              File Dispute
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No disputes filed
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((dispute) => (
                <div
                  key={dispute.id}
                  className="p-4 border rounded-lg hover:bg-secondary/30 cursor-pointer transition-colors"
                  onClick={() => {
                    setSelectedDispute(dispute);
                    fetchMessages(dispute.id);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{dispute.dispute_type.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        Booking #{dispute.booking_id}
                      </p>
                    </div>
                    {getStatusBadge(dispute.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {dispute.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Filed: {new Date(dispute.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Dispute Dialog */}
      <Dialog open={showFileForm} onOpenChange={setShowFileForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>File a Dispute</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Booking ID</label>
              <Input
                placeholder="Enter booking ID"
                value={formData.booking_id}
                onChange={(e) => setFormData({...formData, booking_id: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Dispute Type</label>
              <Select value={formData.dispute_type} onValueChange={(value) => setFormData({...formData, dispute_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_not_received">Product Not Received</SelectItem>
                  <SelectItem value="product_damaged">Product Damaged</SelectItem>
                  <SelectItem value="product_not_as_described">Not As Described</SelectItem>
                  <SelectItem value="late_delivery">Late Delivery</SelectItem>
                  <SelectItem value="refund_request">Refund Request</SelectItem>
                  <SelectItem value="payment_issue">Payment Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Reason</label>
              <Input
                placeholder="Brief reason"
                value={formData.reason}
                onChange={(e) => setFormData({...formData, reason: e.target.value})}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Textarea
                placeholder="Provide detailed description..."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowFileForm(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={fileDispute} className="flex-1">
                Submit Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Messages Dialog */}
      <Dialog open={!!selectedDispute} onOpenChange={() => setSelectedDispute(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Dispute #{selectedDispute?.dispute_number}</span>
              {selectedDispute && getStatusBadge(selectedDispute.status)}
            </DialogTitle>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4">
              <div className="bg-secondary/30 p-4 rounded-lg">
                <p className="font-medium mb-2">{selectedDispute.dispute_type.replace(/_/g, ' ')}</p>
                <p className="text-sm text-muted-foreground">{selectedDispute.description}</p>
              </div>

              <div className="border rounded-lg p-4 max-h-96 overflow-y-auto space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.sender_type === 'admin' ? 'bg-blue-500/10' : 'bg-secondary/30'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{msg.sender_name}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))}
              </div>

              {selectedDispute.status !== 'resolved' && selectedDispute.status !== 'closed' && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  <Button onClick={sendMessage}>
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
