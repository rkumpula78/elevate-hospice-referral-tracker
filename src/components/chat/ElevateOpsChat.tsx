import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Trash2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function getPageContext(pathname: string): Record<string, string> | null {
  if (pathname.startsWith('/referral/')) return { currentPage: 'referral', recordId: pathname.split('/')[2] };
  if (pathname.startsWith('/patient/')) return { currentPage: 'patient', recordId: pathname.split('/')[2] };
  if (pathname.startsWith('/organizations/')) return { currentPage: 'organization', recordId: pathname.split('/')[2] };
  if (pathname === '/dashboard') return { currentPage: 'dashboard' };
  if (pathname === '/referrals') return { currentPage: 'referrals_list' };
  if (pathname === '/patients') return { currentPage: 'patients_list' };
  if (pathname === '/organizations') return { currentPage: 'organizations_list' };
  if (pathname === '/schedule') return { currentPage: 'schedule' };
  if (pathname === '/training') return { currentPage: 'training' };
  if (pathname === '/analytics') return { currentPage: 'analytics' };
  if (pathname === '/compliance') return { currentPage: 'compliance' };
  if (pathname === '/kpi') return { currentPage: 'kpi' };
  return { currentPage: 'other' };
}

export default function ElevateOpsChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const location = useLocation();
  const { displayName } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const updated = [...messages, userMsg];
    setMessages(updated);
    setInput('');
    setLoading(true);

    try {
      const context = getPageContext(location.pathname);
      const { data, error } = await supabase.functions.invoke('elevate-ops-chat', {
        body: {
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          context,
        },
      });

      if (error) throw error;

      const reply = data?.choices?.[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] max-h-[calc(100vh-8rem)] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-primary text-primary-foreground rounded-t-2xl">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-semibold text-sm">Elevate Ops</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMessages([])}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-primary-foreground/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground text-sm py-8 space-y-2">
                <Bot className="w-10 h-10 mx-auto opacity-40" />
                <p className="font-medium">Hi{displayName ? `, ${displayName}` : ''}!</p>
                <p>Ask me anything about hospice operations, compliance, referrals, or documentation.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                  <LoadingSpinner size={16} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Elevate Ops..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground min-h-[38px] max-h-[100px]"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FAB Bubble */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'fixed bottom-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 hover:scale-110 active:scale-95',
          isOpen ? 'bg-muted text-foreground' : 'bg-primary text-primary-foreground'
        )}
        aria-label={isOpen ? 'Close Elevate Ops chat' : 'Open Elevate Ops chat'}
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
      </button>
    </>
  );
}
