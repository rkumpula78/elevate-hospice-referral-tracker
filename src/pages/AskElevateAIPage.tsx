import ElevateOpsChat from "@/components/chat/ElevateOpsChat";
import { useAuth } from "@/hooks/useAuth";
import { canUseAskElevateAI } from "@/lib/featureFlags";
import { Navigate, useLocation } from "react-router-dom";
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2, RotateCcw, ChevronDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { extractAssistantReply } from "@/lib/chatResponse";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  error?: boolean;
}

const SUGGESTED_PROMPTS = [
  "What are the Medicare CoPs for hospice eligibility?",
  "What ACHC standards apply to our documentation?",
  "What's our 2-hour response time guarantee policy?",
  "How do we track referral share by facility?",
  "Draft a compassionate note for a family considering hospice.",
  "What are the LCD indicators for CHF on hospice?",
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-1 py-0.5">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
          style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
        />
      ))}
    </div>
  );
}

function getPageContext(pathname: string): Record<string, string> | null {
  return { currentPage: "ask-elevate", source: pathname };
}

export default function AskElevateAIPage() {
  const { user, displayName } = useAuth();
  const location = useLocation();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (isAtBottom) scrollToBottom();
  }, [messages, isLoading, isAtBottom, scrollToBottom]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return;

      setShowSuggestions(false);
      setInput("");

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      const history = [...messages, userMsg]
        .slice(-10)
        .map(({ role, content }) => ({ role, content }));

      try {
        const context = getPageContext(location.pathname);
        const { data, error } = await supabase.functions.invoke("elevate-ops-chat", {
          body: { messages: history, context },
        });

        if (error) throw new Error(error.message);

        const reply = extractAssistantReply(data);

        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: "assistant", content: reply, timestamp: new Date() },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: generateId(), role: "assistant", content: "Something went wrong. Please try again.", timestamp: new Date(), error: true },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => textareaRef.current?.focus(), 50);
      }
    },
    [isLoading, messages, location.pathname]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const clearConversation = () => {
    setMessages([]);
    setShowSuggestions(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] p-4 md:p-6 max-w-3xl mx-auto w-full">
      <div className="flex flex-col h-full bg-card rounded-xl border border-border overflow-hidden shadow-sm">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-sm">
                <Sparkles className="w-[18px] h-[18px] text-primary-foreground" strokeWidth={1.8} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-card" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground leading-tight">Ask ElevateAI</h2>
              <p className="text-[11px] text-muted-foreground leading-tight">Powered by Elevate Ops · OpenClaw</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearConversation} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                <RotateCcw className="w-3 h-3 mr-1" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea
          ref={scrollAreaRef}
          className="flex-1 px-4 py-4"
          onScrollCapture={(e) => {
            const el = e.currentTarget.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
            if (el) {
              setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
            }
          }}
        >
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-md">
                <Sparkles className="w-7 h-7 text-primary-foreground" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {displayName ? `Hi, ${displayName}!` : "Elevate Ops is ready"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Ask anything about hospice operations, compliance, or patient care</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex gap-3 max-w-[88%]", msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto")}>
                <div className={cn("flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5", msg.role === "assistant" ? "bg-gradient-to-br from-primary to-accent" : "bg-muted")}>
                  {msg.role === "assistant" ? <Bot className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={1.8} /> : <User className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.8} />}
                </div>
                <div className="flex flex-col gap-1">
                  <div className={cn("px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap", msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-sm" : msg.error ? "bg-destructive/10 text-destructive border border-destructive/20 rounded-tl-sm" : "bg-muted text-foreground border border-border rounded-tl-sm")}>
                    {msg.content}
                  </div>
                  <span className={cn("text-[10px] text-muted-foreground", msg.role === "user" ? "text-right" : "text-left")}>{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 mr-auto max-w-[88%]">
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mt-0.5">
                  <Bot className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={1.8} />
                </div>
                <div className="px-3.5 py-3 bg-muted border border-border rounded-2xl rounded-tl-sm">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </ScrollArea>

        {/* Scroll to bottom */}
        {!isAtBottom && (
          <div className="absolute bottom-[88px] right-6 z-10">
            <Button size="sm" variant="outline" onClick={scrollToBottom} className="h-7 w-7 p-0 rounded-full shadow-md">
              <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* Suggested prompts */}
        {showSuggestions && messages.length === 0 && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-muted-foreground mb-2 font-medium uppercase tracking-wide">Quick starts</p>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button key={prompt} onClick={() => sendMessage(prompt)} className="text-[11px] px-2.5 py-1 rounded-full border border-border text-muted-foreground bg-card hover:bg-accent/10 hover:border-accent/30 hover:text-accent-foreground transition-all duration-150">
                  {prompt.length > 42 ? prompt.slice(0, 42) + "…" : prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-4 pb-4 pt-2 border-t border-border bg-card">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Elevate Ops anything… (Enter to send)"
              className="flex-1 min-h-[44px] max-h-[140px] resize-none text-sm rounded-xl"
              rows={1}
              disabled={isLoading}
            />
            <Button onClick={() => sendMessage(input)} disabled={!input.trim() || isLoading} className="h-[44px] w-[44px] p-0 flex-shrink-0 rounded-xl">
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">Elevate Ops · Confidential — For internal use only</p>
        </div>
      </div>
    </div>
  );
}
