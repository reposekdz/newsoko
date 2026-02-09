import React, { useState, useEffect } from 'react';

interface Conversation {
  other_user_id: number;
  other_name: string;
  other_avatar: string;
  product_id: number;
  product_title: string;
  product_images: string[];
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

interface Message {
  id: number;
  sender_id: number;
  message: string;
  created_at: string;
  is_read: boolean;
}

export const MessagingSystem: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadConversations();
    loadUnreadCount();
    const interval = setInterval(() => {
      loadUnreadCount();
      if (selectedConv) loadMessages(selectedConv.other_user_id, selectedConv.product_id);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadConversations = async () => {
    const res = await fetch('/api/controllers/messaging.php?conversations=1');
    const data = await res.json();
    if (data.success) setConversations(data.data);
  };

  const loadMessages = async (userId: number, productId: number) => {
    const res = await fetch(`/api/controllers/messaging.php?conversation=1&other_user_id=${userId}&product_id=${productId}`);
    const data = await res.json();
    if (data.success) setMessages(data.data);
  };

  const loadUnreadCount = async () => {
    const res = await fetch('/api/controllers/messaging.php?unread_count=1');
    const data = await res.json();
    if (data.success) setUnreadCount(data.count);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConv) return;
    
    const res = await fetch('/api/controllers/messaging.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'send',
        receiver_id: selectedConv.other_user_id,
        product_id: selectedConv.product_id,
        message: newMessage
      })
    });
    
    if (res.ok) {
      setNewMessage('');
      loadMessages(selectedConv.other_user_id, selectedConv.product_id);
    }
  };

  return (
    <div className="messaging-system">
      <div className="conversations-list">
        <h2>Messages {unreadCount > 0 && <span className="badge">{unreadCount}</span>}</h2>
        {conversations.map(conv => (
          <div 
            key={`${conv.other_user_id}-${conv.product_id}`}
            className={`conversation ${selectedConv?.other_user_id === conv.other_user_id ? 'active' : ''}`}
            onClick={() => {
              setSelectedConv(conv);
              loadMessages(conv.other_user_id, conv.product_id);
            }}
          >
            <img src={conv.other_avatar} alt={conv.other_name} />
            <div>
              <h3>{conv.other_name}</h3>
              <p className="product-title">{conv.product_title}</p>
              <p className="last-message">{conv.last_message}</p>
            </div>
            {conv.unread_count > 0 && <span className="unread">{conv.unread_count}</span>}
          </div>
        ))}
      </div>
      
      <div className="messages-panel">
        {selectedConv ? (
          <>
            <div className="messages-header">
              <img src={selectedConv.other_avatar} alt={selectedConv.other_name} />
              <div>
                <h3>{selectedConv.other_name}</h3>
                <p>{selectedConv.product_title}</p>
              </div>
            </div>
            
            <div className="messages-list">
              {messages.map(msg => (
                <div key={msg.id} className={`message ${msg.sender_id === selectedConv.other_user_id ? 'received' : 'sent'}`}>
                  <p>{msg.message}</p>
                  <span className="time">{new Date(msg.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
            
            <div className="message-input">
              <textarea 
                value={newMessage}
                onChange={e => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        ) : (
          <div className="no-conversation">Select a conversation</div>
        )}
      </div>
    </div>
  );
};
