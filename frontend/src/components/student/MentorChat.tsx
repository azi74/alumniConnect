import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  MessageCircle, 
  ArrowUp, 
  User,
  ArrowLeft
} from 'lucide-react';
import api from '@/api';
import { useAuth } from '@/hooks/useAuth';

interface Message {
  _id: string;
  content: string;
  sender: string;
  receiver: string;
  createdAt: string;
  read: boolean;
}

interface Alumni {
  _id: string;
  name: string;
  profilePhoto?: string;
  currentRole: string;
  currentCompany: string;
}

const MentorChat = () => {
  const { alumniId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alumnus, setAlumnus] = useState<Alumni | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch alumni details
        const alumniResponse = await api.get(`/alumni/${alumniId}`);
        setAlumnus(alumniResponse.data.data);
        
        // Fetch conversation messages
        const messagesResponse = await api.get(`/messages/${alumniId}`);
        setMessages(messagesResponse.data.data);
      } catch (error) {
        console.error('Failed to fetch chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (alumniId) {
      fetchData();
    }
  }, [alumniId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim() || !alumniId || !user) return;
    
    const tempId = Date.now().toString();
    
    try {
      const newMessage = {
        content: input,
        receiver: alumniId
      };
      
      // Optimistically update UI
      setMessages(prev => [...prev, {
        _id: tempId,
        content: input,
        sender: user.id,
        receiver: alumniId,
        createdAt: new Date().toISOString(),
        read: false
      }]);
      setInput('');
      
      // Send message to backend
      const response = await api.post('/messages', newMessage);
      
      // Replace temporary message with actual message from server
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? response.data.data : msg
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic update if failed
      setMessages(prev => prev.filter(msg => msg._id !== tempId));
    }
  };

  if (loading || !alumnus) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Back button for mobile */}
      <div className="md:hidden">
        <Button 
          variant="outline" 
          onClick={() => navigate('/student-portal?tab=chat')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to chats
        </Button>
      </div>
      
      {/* Chat area */}
      <div className="md:col-span-4">
        <Card className="glass-card rounded-xl overflow-hidden animate-fade-in h-[550px] flex flex-col">
          {/* Chat header */}
          <div className="p-3 border-b flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {alumnus.profilePhoto ? (
                  <img 
                    src={alumnus.profilePhoto} 
                    alt={alumnus.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-medium text-sm leading-tight">{alumnus.name}</h3>
                <p className="text-xs text-muted-foreground leading-tight">
                  {alumnus.currentRole} at {alumnus.currentCompany}
                </p>
              </div>
            </div>
          </div>
          
          {/* Messages area */}
          <div className="flex-grow overflow-y-auto p-4 bg-slate-50/50 space-y-4">
            {messages.map(message => (
              <div 
                key={message._id}
                className={`flex ${message.sender === user?.id ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {message.sender !== user?.id && (
                  <div className="w-8 h-8 rounded-full overflow-hidden mr-2 flex-shrink-0 mt-1">
                    {alumnus.profilePhoto ? (
                      <img 
                        src={alumnus.profilePhoto} 
                        alt={alumnus.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-500" />
                      </div>
                    )}
                  </div>
                )}
                
                <div 
                  className={`max-w-[80%] p-3 rounded-lg flex flex-col ${
                    message.sender === user?.id 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white border border-slate-200 rounded-tl-none'
                  }`}
                >
                  <span className="text-sm">{message.content}</span>
                  <span 
                    className={`text-xs ${
                      message.sender === user?.id 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    } self-end mt-1`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {!message.read && message.sender === user?.id && (
                      <span className="ml-1">✓</span>
                    )}
                  </span>
                </div>
                
                {message.sender === user?.id && (
                  <div className="w-8 h-8 rounded-full overflow-hidden ml-2 flex-shrink-0 mt-1 bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input area */}
          <div className="p-3 border-t">
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="min-h-[60px] pr-14 resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="absolute right-2 bottom-2 rounded-full"
                disabled={!input.trim()}
              >
                <ArrowUp className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MentorChat;