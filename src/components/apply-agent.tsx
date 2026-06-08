import { useState, useRef, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const SUGGESTIONS = [
  "How do I upload my resume?",
  "Where can I see job matches?",
  "How does ranking work?",
  "Show me the review queue",
];

function messageText(m: UIMessage) {
  return m.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
}

export function ApplyAgent() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const transport = useRef(new DefaultChatTransport({ api: "/api/agent" })).current;
  const { messages, sendMessage, status } = useChat({
    id: "guide-agent",
    transport,
    onError: (e) => toast.error(e.message || "Agent error"),
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const submit = async (text?: string) => {
    const t = (text ?? input).trim();
    if (!t || isLoading) return;
    setInput("");
    await sendMessage({ text: t });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-yellow-400 text-yellow-950 shadow-lg shadow-yellow-500/40 transition hover:scale-110 hover:bg-yellow-300"
        title="Open guide"
        aria-label="Open guide"
      >
        <MessageCircle className="h-6 w-6" strokeWidth={2.25} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[min(640px,80vh)] w-[min(420px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-yellow-500/10 animate-fade-in">
      <div className="flex items-center gap-2 border-b border-border bg-gradient-to-r from-yellow-400/15 to-card px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400 text-yellow-950">
          <MessageCircle className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold">Guide</div>
          <div className="text-[11px] text-muted-foreground">Your in-app assistant</div>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3 text-sm">
              <div className="mb-1 flex items-center gap-1.5 font-medium">
                <Sparkles className="h-3.5 w-3.5 text-yellow-500" /> Hi! I&apos;m your in-app guide.
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Ask me how to use any feature — uploading your resume, finding job matches,
                ranking, the review queue, interview prep, or where to click next.
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground hover:border-yellow-400/60 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => {
          const text = messageText(m);
          if (!text) return null;
          return (
            <div key={m.id} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.role === "user"
                    ? "max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-sm text-primary-foreground"
                    : "max-w-[85%] text-sm text-foreground"
                }
              >
                {m.role === "assistant" ? (
                  <div className="prose prose-sm prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0">
                    <ReactMarkdown>{text}</ReactMarkdown>
                  </div>
                ) : (
                  text
                )}
              </div>
            </div>
          );
        })}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Thinking…
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background px-3 py-2">
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask how to use the app…"
            rows={1}
            className="min-h-[36px] resize-none text-sm"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => submit()}
            disabled={isLoading || !input.trim()}
            className="h-9 w-9 shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
