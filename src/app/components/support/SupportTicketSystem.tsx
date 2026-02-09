import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { MessageSquare, Send, Loader2, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../../../services/api';
import { useToast } from '../ui/use-toast';

export function SupportTicketSystem() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    subject: '',
    category: 'other',
    priority: 'medium',
    description: ''
  });

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const result = await api.getSupportTickets();
      if (result.success) {
        setTickets(result.tickets);
      }
    } catch (error) {
      toast({ title: 'Failed to load tickets', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketDetails = async (ticketId: number) => {
    try {
      const result = await api.getSupportTicketDetails(ticketId);
      if (result.success) {
        setSelectedTicket(result.ticket);
        setMessages(result.messages);
      }
    } catch (error) {
      toast({ title: 'Failed to load ticket details', variant: 'destructive' });
    }
  };

  const createTicket = async () => {
    if (!formData.subject || !formData.description) {
      toast({ title: 'Fill all required fields', variant: 'destructive' });
      return;
    }

    try {
      const result = await api.createSupportTicket(formData);
      if (result.success) {
        toast({ title: 'Ticket created successfully' });
        setShowCreate(false);
        setFormData({ subject: '', category: 'other', priority: 'medium', description: '' });
        fetchTickets();
      }
    } catch (error) {
      toast({ title: 'Failed to create ticket', variant: 'destructive' });
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const result = await api.addSupportTicketMessage(selectedTicket.id, newMessage);
      if (result.success) {
        setNewMessage('');
        fetchTicketDetails(selectedTicket.id);
      }
    } catch (error) {
      toast({ title: 'Failed to send message', variant: 'destructive' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'resolved': return 'bg-green-500';
      case 'closed': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (showCreate) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Support Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Subject *</Label>
            <Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Brief description of your issue" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="dispute">Dispute</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({ ...formData, priority: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Description *</Label>
            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Detailed description of your issue" rows={6} />
          </div>
          <div className="flex gap-2">
            <Button onClick={createTicket} className="flex-1">Create Ticket</Button>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedTicket) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{selectedTicket.subject}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge className={getStatusColor(selectedTicket.status)}>{selectedTicket.status}</Badge>
                <Badge variant="outline">{selectedTicket.category}</Badge>
                <Badge variant="outline">{selectedTicket.priority}</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={() => setSelectedTicket(null)}>Back</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id} className={`p-3 rounded-lg ${msg.user_id === selectedTicket.user_id ? 'bg-primary/10 ml-8' : 'bg-secondary/30 mr-8'}`}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm">{msg.user_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</p>
                </div>
                <p className="text-sm">{msg.message}</p>
              </div>
            ))}
          </div>
          {selectedTicket.status !== 'closed' && (
            <div className="flex gap-2">
              <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." onKeyPress={(e) => e.key === 'Enter' && sendMessage()} />
              <Button onClick={sendMessage}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Support Tickets
          </CardTitle>
          <Button onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No support tickets</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="p-4 border rounded-lg hover:bg-secondary/30 cursor-pointer" onClick={() => fetchTicketDetails(ticket.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">{ticket.subject}</h4>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getStatusColor(ticket.status)} variant="outline">{ticket.status}</Badge>
                      <Badge variant="outline">{ticket.category}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(ticket.created_at).toLocaleString()}
                    </p>
                  </div>
                  {ticket.status === 'resolved' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <Clock className="h-5 w-5 text-yellow-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
