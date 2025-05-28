import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NavigationBar from '@/components/NavigationBar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { BrainCircuit, ArrowUp, User, RotateCcw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import axios from 'axios';

type Message = {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
};

const initialMessages: Message[] = [
  {
    id: '1',
    content: 'Hi there! 👋 I\'m AlumniConnect AI, your personal assistant for all alumni-related questions. How can I help you today?',
    role: 'assistant',
    timestamp: new Date()
  }
];

const suggestedQuestions = [
  "How can I find alumni mentors in my field?",
  "When is the next networking event?",
  "What scholarships are available for alumni?",
  "How do I update my profile information?"
];

const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    if (!hasInteracted) {
      setHasInteracted(true);
    }
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      role: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setActiveQuestionIndex(null);
    
    setIsTyping(true);
    
    try {
      const botResponse = await getBotResponse(input);
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: botResponse,
        role: 'assistant',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error processing your request.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
      toast.success("Response generated!", {
        icon: <Sparkles className="h-4 w-4 text-yellow-400" />,
      });
    }
  };

  const getBotResponse = async (query: string): Promise<string> => {
    try {
      const response = await axios.post('https://chatbot-4tua.onrender.com/api/chat', 
        { message: query },
        { headers: { 'Content-Type' : 'application/json'}}
      );
      return response.data.response;
    } catch (error) {
      console.error('Error calling chatbot API:', error);
      return "I'm having trouble connecting to the chatbot service. Please try again later.";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuestionClick = (question: string, index: number) => {
    setInput(question);
    setActiveQuestionIndex(index);
    setHasInteracted(true);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <NavigationBar />
      
      <main className="flex-grow pt-10 pb-10 px-4">
        <div className="container mx-auto max-w-4xl">
          {!hasInteracted ? (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-180px)]">
              {/* Centered Large Heading */}
              <div className="text-center mb-10">
                <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
                  <BrainCircuit className="h-10 w-10 text-primary" />
                  <span className="text-primary">AlumniConnect AI</span>
                </h1>
                <p className="text-lg text-muted-foreground">
                  Your intelligent alumni assistant
                </p>
              </div>
              
              {/* Large Textbox */}
              <div className="w-full max-w-2xl mb-6">
                <div className="relative">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything about alumni resources, events, or connections..."
                    className="min-h-[100px] text-lg pr-14 resize-none rounded-xl border-slate-300 focus-visible:ring-primary"
                    maxLength={500}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    size="icon"
                    className={cn(
                      "absolute right-3 bottom-3 rounded-full h-10 w-10",
                      input.trim() && !isTyping ? "bg-primary hover:bg-primary/90" : "bg-slate-200"
                    )}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Suggested questions below textbox */}
              <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-3">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleQuestionClick(question, index)}
                    className="p-4 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors text-left text-base hover:shadow-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-md border border-slate-200">
              {/* Chat messages */}
              <div className="h-[65vh] overflow-y-auto p-6 space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex gap-4 max-w-[90%]",
                      message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0",
                        message.role === 'user'
                          ? "bg-primary text-white"
                          : "bg-purple-500 text-white"
                      )}
                    >
                      {message.role === 'user' ? (
                        <User className="h-6 w-6" />
                      ) : (
                        <BrainCircuit className="h-6 w-6" />
                      )}
                    </div>
                    
                    <div
                      className={cn(
                        "p-5 rounded-2xl flex-1 shadow-sm",
                        message.role === 'user' 
                          ? "bg-primary text-white rounded-tr-none" 
                          : "bg-slate-50 rounded-tl-none border border-slate-200"
                      )}
                    >
                      <div className="prose">
                        <p className="whitespace-pre-wrap text-base">{message.content}</p>
                      </div>
                      <div 
                        className={cn(
                          "text-sm mt-2 opacity-70 flex items-center gap-1",
                          message.role === 'user' ? "text-white/80" : "text-slate-500"
                        )}
                      >
                        {message.role === 'assistant' && (
                          <Sparkles className="h-4 w-4" />
                        )}
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-4 max-w-[90%] mr-auto">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full flex-shrink-0 bg-purple-500 text-white">
                      <BrainCircuit className="h-6 w-6" />
                    </div>
                    <div className="p-5 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 rounded-full bg-slate-300 animate-bounce"></div>
                        <div className="w-3 h-3 rounded-full bg-slate-300 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-3 h-3 rounded-full bg-slate-300 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Input area */}
              <div className="p-5 border-t border-slate-200 bg-white">
                <div className="relative">
                  <Textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Message AlumniConnect AI..."
                    className="min-h-[100px] text-lg pr-14 resize-none rounded-xl border-slate-300 focus-visible:ring-primary"
                    maxLength={500}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    size="icon"
                    className={cn(
                      "absolute right-3 bottom-3 rounded-full h-10 w-10",
                      input.trim() && !isTyping ? "bg-primary hover:bg-primary/90" : "bg-slate-200"
                    )}
                  >
                    <ArrowUp className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setMessages(initialMessages);
                      setHasInteracted(false);
                    }}
                    className="text-sm h-9 px-3 hover:bg-slate-100"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Reset chat
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default AIChat;