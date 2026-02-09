import { Send, ArrowLeft, User, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { api, completeApi } from '@/services';
import { useAuth } from '../../../context/AuthContext';

export function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (user) loadConversations();
  }, [user]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      const interval = setInterval(() => loadMessages(selectedConversation.id), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    const response = await completeApi.messaging.getConversations();
    if (response.success) setConversations(response.data);
  };

  const loadMessages = async (conversationId: number) => {
    const response = await completeApi.messaging.getMessages(selectedConversation.other_id, selectedConversation.product_id);
    if (response.success) setMessages(response.data);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    const response = await completeApi.messaging.sendMessage(
      selectedConversation.other_id,
      selectedConversation.product_id,
      newMessage
    );
    
    if (response.success) {
      setNewMessage('');
      loadMessages(selectedConversation.id);
      loadConversations();
    }
  };

  const filteredConversations = conversations.filter(c => 
    c.other_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Please login to view messages</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        <Card className="lg:col-span-1">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search conversations..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-300px)]">
              {filteredConversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conv.id ? 'bg-primary/10' : 'hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={conv.other_avatar} />
                      <AvatarFallback>{conv.other_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold truncate">{conv.other_name}</span>
                        {conv.unread_count > 0 && (
                          <Badge variant="destructive" className="ml-2">{conv.unread_count}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{conv.last_message}</p>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredConversations.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No conversations yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0 h-full flex flex-col">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b flex items-center gap-3">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)} className="lg:hidden">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Avatar>
                    <AvatarImage src={selectedConversation.other_avatar} />
                    <AvatarFallback>{selectedConversation.other_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold">{selectedConversation.other_name}</h3>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-lg p-3 ${
                        msg.sender_id === user.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-secondary'
                      }`}>
                        <p className="text-sm">{msg.message}</p>
                        <span className="text-xs opacity-70">
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                      rows={2}
                      className="resize-none"
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center space-y-2">
                  <User className="h-16 w-16 mx-auto opacity-50" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
