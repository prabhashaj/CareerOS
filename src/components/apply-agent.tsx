import { useState, useRef, useEffect, useCallback } from "react";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  History,
  Layers,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import {
  useAgentContext,
  type AgentChatMessage,
} from "@/hooks/use-agent-context";
import { tailorResume } from "@/lib/agent.functions";
import { normalizeResume, type ResumeContent } from "@/lib/resume";

const STUDIO_SUGGESTIONS = [
  "Quantify impact and add metrics in work experience",
  "Add ATS keywords for this job",
  "Write an impactful 3-sentence summary",
  "Tighten bullet points for 1-page fit",
];

const GUIDE_SUGGESTIONS = [
  "How do I upload my resume?",
  "How does ATS match work?",
  "How do I tailor for a specific job?",
  "How do I export to ATS-friendly PDF?",
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export function ApplyAgent() {
  const {
    isStudioActive,
    jobContext,
    getStudioSession,
    messages,
    setMessages,
    isChatOpen,
    setIsChatOpen,
  } = useAgentContext();

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize greeting if empty
  useEffect(() => {
    if (messages.length === 0) {
      if (isStudioActive && jobContext) {
        setMessages([
          {
            id: uid(),
            role: "agent",
            text: `Hi! I'm your AI Resume Copilot. I've loaded target job **${jobContext.title}** at **${jobContext.company}**. Tell me how you'd like to tailor your resume, or ask me any question!`,
          },
        ]);
      } else if (isStudioActive) {
        setMessages([
          {
            id: uid(),
            role: "agent",
            text: `Hi! I'm your AI Resume Copilot. Tell me what to improve — e.g. "Quantify my experience" or "Add more TypeScript keywords" — and I'll edit your resume with full undo & revert support.`,
          },
        ]);
      }
    }
  }, [isStudioActive, jobContext, messages.length, setMessages]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isChatOpen]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  // Handle conversational undo / revert
  const handleUndoOrRevert = useCallback(
    (command: string) => {
      const studioSession = getStudioSession();
      if (!isStudioActive || !studioSession) {
        toast.info("Undo & Revert are available inside Resume Studio.");
        return;
      }

      const userMsg: AgentChatMessage = { id: uid(), role: "user", text: command };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      // Check if user specified a version number, e.g. "revert to v2" or "revert to 2"
      const match = command.match(/\b(?:v|version|checkpoint)?\s*(\d+)\b/i);
      if (match && match[1]) {
        const targetVer = parseInt(match[1], 10);
        const found = studioSession.versions.find((v) => v.version === targetVer);
        if (found) {
          studioSession.handleRevertToCheckpoint(found);
          return;
        }
      }

      if (studioSession.versions.length > 0) {
        studioSession.handleRevertLastChange();
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "agent",
            text: "No previous saved checkpoints found. You can create a checkpoint snapshot anytime using the Checkpoints button!",
          },
        ]);
        toast.info("No previous checkpoints found");
      }
    },
    [isStudioActive, getStudioSession, setMessages],
  );

  // Accept a proposed AI resume change
  const acceptChange = useCallback(
    (msg: AgentChatMessage) => {
      const studioSession = getStudioSession();
      if (!msg.pendingResume || !studioSession) return;
      const currentBeforeChange = studioSession.content;

      // Auto-save checkpoint of current state before applying revision
      const labelDesc = msg.changelog?.[0] || msg.text.slice(0, 32);
      void studioSession.createCheckpoint(`Pre-AI: ${labelDesc}`, currentBeforeChange, "agent");

      studioSession.setContent(msg.pendingResume);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.id
            ? { ...m, pendingResume: undefined, previousResume: currentBeforeChange }
            : m,
        ),
      );
      void studioSession.saveResume(msg.pendingResume);
      toast.success("Changes accepted (Checkpoint saved)");
    },
    [getStudioSession, setMessages],
  );

  // Reject a proposed AI resume change
  const rejectChange = useCallback(
    (msg: AgentChatMessage) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === msg.id ? { ...m, pendingResume: undefined } : m)),
      );
      toast.info("Changes rejected");
    },
    [setMessages],
  );

  // Revert an already accepted change
  const revertMessageChange = useCallback(
    (msg: AgentChatMessage) => {
      const studioSession = getStudioSession();
      if (!msg.previousResume || !studioSession) return;
      const prev = normalizeResume(msg.previousResume);
      studioSession.setContent(prev);
      void studioSession.saveResume(prev);

      setMessages((msgs) =>
        msgs.map((m) => (m.id === msg.id ? { ...m, isReverted: true } : m)),
      );
      setMessages((msgs) => [
        ...msgs,
        {
          id: uid(),
          role: "agent",
          text: `↩ **Change Reverted**: Restored resume to state prior to change: "${msg.changelog?.[0] || msg.text.slice(0, 35)}"`,
        },
      ]);
      toast.success("Change reverted successfully");
    },
    [getStudioSession, setMessages],
  );

  // Send message
  const submit = async (customText?: string) => {
    const raw = (customText ?? input).trim();
    if (!raw || isLoading) return;

    // Check for conversational undo / revert commands
    if (/^(revert|undo|go back|rollback|restore checkpoint|revert back)/i.test(raw)) {
      handleUndoOrRevert(raw);
      return;
    }

    const userMsg: AgentChatMessage = { id: uid(), role: "user", text: raw };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const studioSession = getStudioSession();
      if (isStudioActive && studioSession) {
        // Run tailoring via agent functions
        const result = await tailorResume({
          data: {
            resume: studioSession.content,
            instruction: raw,
            jobTitle: studioSession.jobRow?.title,
            company: studioSession.jobRow?.company,
            jobDescription: studioSession.jobRow?.description || undefined,
          },
        });

        let pending: ResumeContent | undefined;
        try {
          if (result.resumeJson) {
            pending = normalizeResume(JSON.parse(result.resumeJson));
          }
        } catch (e) {
          console.error("Failed to parse resume JSON", e);
        }

        const agentMsg: AgentChatMessage = {
          id: uid(),
          role: "agent",
          text: result.reply || "I've tailored your resume based on your request.",
          changelog: result.changelog,
          questions: result.questions,
          pendingResume: pending,
        };
        setMessages((prev) => [...prev, agentMsg]);
      } else {
        // In-app guide fallback
        const res = await fetch("/api/agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              ...messages.map((m) => ({
                id: m.id,
                role: m.role === "agent" ? "assistant" : m.role,
                parts: [{ type: "text", text: m.text }],
              })),
              { id: userMsg.id, role: "user", parts: [{ type: "text", text: raw }] },
            ],
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to get response from guide assistant");
        }

        const responseText = await res.text();
        // Parse stream or text
        let cleanText = responseText;
        try {
          // If SSE / UI Message stream, extract plain text parts
          const lines = responseText.split("\n");
          const collected: string[] = [];
          for (const line of lines) {
            if (line.startsWith("0:")) {
              const textContent = line.slice(2).trim();
              if (textContent.startsWith('"') && textContent.endsWith('"')) {
                collected.push(JSON.parse(textContent));
              } else {
                collected.push(textContent);
              }
            } else if (line.startsWith("data:")) {
              collected.push(line.replace("data:", "").trim());
            }
          }
          if (collected.length > 0) {
            cleanText = collected.join("");
          }
        } catch {
          // Use raw text
        }

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "agent",
            text: cleanText || "Here is information on how to use CareerOS.",
          },
        ]);
      }
    } catch (err) {
      console.error("Agent error:", err);
      toast.error(err instanceof Error ? err.message : "Agent request failed");
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "agent",
          text: "I encountered an error processing your request. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentStudioSession = getStudioSession();

  if (!isChatOpen) {
    return (
      <button
        onClick={() => setIsChatOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xl transition-all duration-200 hover:scale-110 hover:shadow-primary/30"
        title={isStudioActive ? "Open AI Resume Copilot" : "Open Guide"}
        aria-label="Open AI Assistant"
      >
        <div className="relative flex items-center justify-center">
          <MessageCircle className="h-6 w-6" strokeWidth={2.25} />
          {isStudioActive && (
            <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </span>
          )}
        </div>
      </button>
    );
  }

  const suggestions = isStudioActive ? STUDIO_SUGGESTIONS : GUIDE_SUGGESTIONS;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex h-[min(650px,85vh)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-primary/10 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-border/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-foreground">
                {isStudioActive ? "AI Resume Copilot" : "CareerOS Guide"}
              </span>
              {isStudioActive && (
                <Badge variant="secondary" className="px-1.5 py-0 text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                  Studio
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">
              {isStudioActive ? "Tailor & Revert on Demand" : "Your in-app assistant"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {isStudioActive && currentStudioSession && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              onClick={() => currentStudioSession.openCheckpointsModal()}
              title="Checkpoints & History"
            >
              <History className="size-4" />
            </Button>
          )}
          <button
            onClick={() => setIsChatOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="Close chat"
          >
            <X className="size-4.5" />
          </button>
        </div>
      </div>

      {/* Context Banner */}
      {isStudioActive && jobContext && (
        <div className="flex items-center gap-2 border-b border-border/80 bg-primary/5 px-4 py-2 text-xs">
          <Briefcase className="size-3.5 text-primary shrink-0" />
          <span className="font-semibold text-primary truncate">{jobContext.title}</span>
          <span className="text-muted-foreground truncate">· {jobContext.company}</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-sm">
              <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
                <Sparkles className="size-4 text-primary" />
                {isStudioActive ? "Ready to refine your resume" : "Hi! I'm your in-app guide."}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isStudioActive
                  ? "Ask me to quantify bullets, add keywords, tighten spacing, or tailor for your target role. You can accept, reject, or revert changes anytime."
                  : "Ask me how to use any feature — uploading your resume, finding job matches, ranking, the review queue, or interview prep."}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-foreground text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div key={m.id} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs",
                m.role === "user"
                  ? "bg-primary text-primary-foreground rounded-tr-xs"
                  : "bg-secondary text-foreground rounded-tl-xs border border-border/60",
              )}
            >
              <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0.5">
                <ReactMarkdown>{m.text}</ReactMarkdown>
              </div>

              {/* Changelog */}
              {m.changelog && m.changelog.length > 0 && (
                <ul className="mt-2.5 space-y-1.5 border-t border-border/40 pt-2 text-xs">
                  {m.changelog.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-muted-foreground">
                      <Layers className="mt-0.5 size-3 shrink-0 text-primary" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Pending Accept / Reject Controls */}
              {m.pendingResume && isStudioActive && (
                <div className="mt-3 flex gap-2 border-t border-border/40 pt-2.5">
                  <button
                    id={`accept-${m.id}`}
                    onClick={() => acceptChange(m)}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                  >
                    <Check className="size-3.5" /> Accept Changes
                  </button>
                  <button
                    id={`reject-${m.id}`}
                    onClick={() => rejectChange(m)}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-accent active:scale-95"
                  >
                    <X className="size-3.5" /> Reject
                  </button>
                </div>
              )}

              {/* Revert button on accepted change */}
              {m.previousResume && !m.isReverted && isStudioActive && (
                <div className="mt-2.5 border-t border-border/40 pt-2">
                  <button
                    id={`revert-${m.id}`}
                    onClick={() => revertMessageChange(m)}
                    className="flex items-center gap-1.5 rounded-lg border border-primary/25 bg-primary/5 px-2.5 py-1 text-[11px] font-medium text-primary transition hover:bg-primary/15 active:scale-95"
                  >
                    <RotateCcw className="size-3" /> Revert this change
                  </button>
                </div>
              )}

              {m.isReverted && (
                <div className="mt-2 border-t border-border/40 pt-1.5">
                  <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/80">
                    Reverted
                  </Badge>
                </div>
              )}

              {/* Follow-up suggestions */}
              {m.questions && m.questions.length > 0 && !m.pendingResume && (
                <div className="mt-3 space-y-1.5 border-t border-border/40 pt-2">
                  {m.questions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => submit(q)}
                      className="block w-full rounded-xl bg-primary/10 px-3 py-1.5 text-left text-xs font-medium text-primary transition hover:bg-primary/20"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-2xl rounded-tl-xs bg-secondary px-3.5 py-2.5 border border-border/60">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin text-primary" />
                <span>{isStudioActive ? "Tailoring resume…" : "Thinking…"}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card p-3">
        <div className="flex gap-2">
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
            placeholder={
              isStudioActive
                ? "Ask to tailor resume or 'revert last change'…"
                : "Ask how to use the app…"
            }
            rows={2}
            className="min-h-[44px] resize-none text-xs leading-relaxed rounded-xl border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={() => submit()}
            disabled={isLoading || !input.trim()}
            className="h-full min-h-[44px] shrink-0 rounded-xl shadow-sm transition hover:shadow-md"
          >
            <Send className="size-4" />
          </Button>
        </div>
        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>Enter to send{isStudioActive ? ' · Type "undo" or "revert"' : ""}</span>
          {isStudioActive && currentStudioSession && currentStudioSession.versions.length > 0 && (
            <button
              onClick={() => currentStudioSession.handleRevertLastChange()}
              className="flex items-center gap-1 text-primary hover:underline"
            >
              <RotateCcw className="size-2.5" /> Revert last
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
