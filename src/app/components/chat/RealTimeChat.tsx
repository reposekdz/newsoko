import { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { MessageCircle, Send, Search, Archive } from 'lucide-react';
import { chatApi } from '../../../services/advancedApi';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export function RealTimeChat() {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);

  useEffect(() => {
    loadConversations();
    
    pollingInterval.current = setInterval(() => {
      if (selectedConversation) {
        loadMessages(selectedConversation.id, true);
      }
      loadConversations();
    }, 3000);

    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      const response = await chatApi.getConversations();
      if (response.success) {
        setConversations(response.data);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId, silent = false) => {
    try {
      const response = await chatApi.getMessages(conversationId);
      if (response.success) {
        setMessages(response.data);
        if (!silent) {
          scrollToBottom();
        }
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
    loadMessages(conversation.id);
    chatApi.markAsRead(conversation.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await chatApi.sendMessage(selectedConversation.id, newMessage, 'text');
      if (response.success) {
        setNewMessage('');
        loadMessages(selectedConversation.id);
        loadConversations();
      }
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.product_title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Messages</h1>
          <p className="text-muted-foreground">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <MessageCircle className="w-5 h-5 mr-2" />
          {conversations.length} Conversations
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
        <Card className="col-span-1 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input placeholder="Search conversations..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-4 text-center text-muted-foreground">Loading...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No conversations yet</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <div key={conv.id} onClick={() => handleSelectConversation(conv)} className={`p-4 border-b cursor-pointer hover:bg-accent transition-colors ${selectedConversation?.id === conv.id ? 'bg-accent' : ''}`}>
                  <div className="flex items-start gap-3">
                    <Avatar>
                      <AvatarImage src={conv.other_user_avatar} />
                      <AvatarFallback>{conv.other_user_name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold truncate">{conv.other_user_name}</h3>
                        {conv.unread_count > 0 && <Badge variant="destructive" className="ml-2">{conv.unread_count}</Badge>}
                      </div>
                      {conv.product_title && <p className="text-xs text-muted-foreground truncate mb-1">Re: {conv.product_title}</p>}
                      <p className="text-sm text-muted-foreground">{conv.last_message_at ? formatDistanceToNow(new Date(conv.last_message_at), { addSuffix: true }) : 'No messages yet'}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </ScrollArea>
        </Card>

        <Card className="col-span-1 md:col-span-2 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedConversation.other_user_avatar} />
                    <AvatarFallback>{selectedConversation.other_user_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{selectedConversation.other_user_name}</h3>
                    {selectedConversation.product_title && <p className="text-sm text-muted-foreground">About: {selectedConversation.product_title}</p>}
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">No messages yet. Start the conversation!</div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id !== selectedConversation.other_user_id;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                          <div className={`flex gap-2 max-w-[70%] ${isOwn ? 'flex-row-reverse' : ''}`}>
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={msg.sender_avatar} />
                              <AvatarFallback>{msg.sender_name?.[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <div className={`rounded-lg p-3 ${isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                                <p className="text-sm">{msg.message}</p>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input placeholder="Type a message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} disabled={sending} className="flex-1" />
                  <Button type="submit" disabled={sending || !newMessage.trim()}><Send className="w-4 h-4" /></Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
