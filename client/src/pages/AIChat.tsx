import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { MessageCircle, Plus, Trash2, Send, Loader2, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ChatMsg = { role: "user" | "assistant"; content: string };

export default function AIChat() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [localMessages, setLocalMessages] = useState<ChatMsg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const utils = trpc.useUtils();

  const { data: sessions, isLoading: sessionsLoading } = trpc.ai.sessions.useQuery();

  const { data: history, isLoading: historyLoading } = trpc.ai.messages.useQuery(
    { sessionId: sessionId ?? 0 },
    { enabled: !!sessionId }
  );

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: () => {
      setPending(false);
      utils.ai.sessions.invalidate();
      utils.ai.messages.invalidate({ sessionId: sessionId ?? 0 });
    },
    onError: (err: { message?: string }) => {
      setPending(false);
      toast.error(err.message || "AI चैट में त्रुटि");
    },
  });

  const deleteSessionMutation = trpc.ai.deleteSession.useMutation({
    onSuccess: (_, vars) => {
      if (sessionId === vars.id) {
        setSessionId(null);
        setLocalMessages([]);
      }
      utils.ai.sessions.invalidate();
      toast.success("बातचीत हटाई गई");
    },
    onError: (err: { message?: string }) => toast.error(err.message || "हटाने में विफल"),
  });

  useEffect(() => {
    if (sessionId && history) {
      setLocalMessages(history.map((m: { role: string; content: string | null }) => ({ role: m.role as "user" | "assistant", content: m.content ?? "" })));
    }
  }, [sessionId, history]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [localMessages]);

  const ensureSession = async (): Promise<number> => {
    if (sessionId) return sessionId;
    const s = await createSessionMutation.mutateAsync({ title: "नई बातचीत" });
    setSessionId(s.id);
    return s.id;
  };

  const createSessionMutation = trpc.ai.createSession.useMutation({
    onSuccess: (res) => setSessionId(res.id),
    onError: (err: { message?: string }) => toast.error(err.message || "सेशन बनाने में विफल"),
  });

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || pending) return;
    setInput("");
    setPending(true);
    const sid = await ensureSession();
    setLocalMessages((m) => [...m, { role: "user", content: msg }]);
    chatMutation.mutate({ message: msg, sessionId: sid });
    // Optimistically add a placeholder; actual message arrives after invalidation
    setTimeout(() => {
      utils.ai.messages.invalidate({ sessionId: sid });
    }, 500);
  };

  const suggested = [
    "गीता का पहला अध्याय किसी के बारे में है?",
    "बंजारा भाषा में अर्जुन का विषाद कैसे दिखायें?",
    "श्लोक 2.47 के लिए नरेटिव स्क्रिप्ट बनाएं",
    "कृष्ण-अर्जुन दृश्य के लिए कैमरा शॉट सुझाव",
  ];

  return (
    <div className="space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="font-display text-2xl font-bold text-foreground mb-1">AI सहायक</h1>
        <p className="text-muted-foreground text-sm">
          बंजारा गीता के श्लोक, अनुवाद और सीन-लेखन में मदद
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 h-[calc(100vh-240px)] min-h-[500px]">
        {/* Sessions sidebar */}
        <div className="bg-gradient-card border border-border rounded-xl p-3 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">बातचीतें</span>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-gold hover:bg-gold/10" onClick={() => { setSessionId(null); setLocalMessages([]); }}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          {sessionsLoading ? (
            <div className="animate-pulse space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-background/50 rounded" />)}</div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="space-y-1.5">
                {(sessions ?? []).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setSessionId(s.id)}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-2.5 py-2 cursor-pointer transition-colors",
                      sessionId === s.id ? "bg-gold/15 border border-gold/30" : "hover:bg-background/50 border border-transparent"
                    )}>
                    <MessageCircle className="w-3.5 h-3.5 text-gold flex-shrink-0" />
                    <span className="text-xs text-foreground line-clamp-1 flex-1">{s.title ?? "बातचीत"}</span>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                      onClick={(e) => { e.stopPropagation(); deleteSessionMutation.mutate({ id: s.id }); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {(sessions ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6">कोई बातचीत नहीं</p>
                )}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Chat area */}
        <div className="bg-gradient-card border border-border rounded-xl flex flex-col">
          <ScrollArea ref={scrollRef} className="flex-1 p-4">
            <div className="space-y-4 max-w-2xl mx-auto">
              {localMessages.length === 0 && !historyLoading && (
                <div className="text-center py-10">
                  <Sparkles className="w-10 h-10 text-gold/50 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">पूछें कुछ भी — बंजारा गीता के संदर्भ में</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {suggested.map((q) => (
                      <button
                        key={q}
                        onClick={() => { setInput(q); }}
                        className="text-xs text-left bg-background/40 border border-border/50 rounded-lg px-3 py-2 text-muted-foreground hover:border-gold/40 hover:text-gold transition-colors">
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {historyLoading && (
                <div className="animate-pulse space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-background/50 rounded" />)}</div>
              )}
              {localMessages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] rounded-xl px-4 py-2.5 text-sm leading-relaxed",
                    m.role === "user"
                      ? "bg-gradient-gold text-primary-foreground"
                      : "bg-background/60 border border-border/50 text-foreground"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {pending && (
                <div className="flex justify-start">
                  <div className="bg-background/60 border border-border/50 rounded-xl px-4 py-2.5 text-sm text-muted-foreground flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> सोच रहा है...
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border/50">
            <div className="flex gap-2 max-w-2xl mx-auto">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                placeholder="बंजारा गीता के बारे में पूछें..."
                disabled={pending}
                className="flex-1"
              />
              <Button className="bg-gradient-gold text-primary-foreground hover:opacity-90" onClick={handleSend} disabled={pending || !input.trim()}>
                {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
