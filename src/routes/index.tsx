import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  FileText,
  Search,
  Wand2,
  Mic,
  Briefcase,
  CheckCircle2,
  Cpu,
  Target,
  FileSearch,
  ChevronRight,
  Play,
  RotateCcw,
  Sliders,
  Award,
  BookOpen,
  HelpCircle,
  TrendingUp,
  FileUp,
  ExternalLink
} from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CareerOS — Your AI Job Search Copilot" },
      {
        name: "description",
        content:
          "Discover roles, tailor every application to your real resume, and prep interviews — all in one place. You approve every action.",
      },
      { property: "og:title", content: "CareerOS — AI Career Copilot" },
      {
        property: "og:description",
        content:
          "Tailored resumes, ranked matches, interview prep. Grounded in your real experience.",
      },
    ],
  }),
  component: Landing,
});

function InteractiveDashboard() {
  const [activeTab, setActiveTab] = useState<"discovery" | "match" | "assets" | "skills" | "interview">("discovery");

  // Discovery simulation state
  const [discoverUrl, setDiscoverUrl] = useState("");
  const [discoverPhase, setDiscoverPhase] = useState<"idle" | "typing" | "indexing" | "complete">("idle");

  // Match simulation state
  const [matchProgress, setMatchProgress] = useState(0);
  const [isMatchComplete, setIsMatchComplete] = useState(false);

  // Resume Tailor state
  const [tailorOriginal] = useState(
    "Managed database instances and wrote data retrieval queries."
  );
  const [tailorModified, setTailorModified] = useState(
    "Managed database instances and wrote data retrieval queries."
  );
  const [isTailoring, setIsTailoring] = useState(false);

  // Skills prep state
  const [activeSkill, setActiveSkill] = useState<"faiss" | "agent">("faiss");

  // Interview state
  const [interviewText, setInterviewText] = useState("");
  const [isAnswering, setIsAnswering] = useState(false);

  // Run typing simulation for discovery
  useEffect(() => {
    if (activeTab === "discovery" && discoverPhase === "idle") {
      const targetUrl = "https://careers.google.com/jobs/ai-platform-engineer";
      setDiscoverPhase("typing");
      setDiscoverUrl("");
      let i = 0;
      const timer = setInterval(() => {
        if (i < targetUrl.length) {
          setDiscoverUrl((prev) => prev + targetUrl.charAt(i));
          i++;
        } else {
          clearInterval(timer);
          setDiscoverPhase("indexing");
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [activeTab, discoverPhase]);

  useEffect(() => {
    if (discoverPhase === "indexing") {
      let progress = 0;
      const timer = setInterval(() => {
        if (progress < 100) {
          progress += 20;
        } else {
          clearInterval(timer);
          setDiscoverPhase("complete");
        }
      }, 150);
      return () => clearInterval(timer);
    }
  }, [discoverPhase]);

  // Run Match Rank load simulation
  useEffect(() => {
    if (activeTab === "match") {
      setMatchProgress(0);
      setIsMatchComplete(false);
      const timer = setInterval(() => {
        setMatchProgress((p) => {
          if (p >= 93) {
            clearInterval(timer);
            setIsMatchComplete(true);
            return 93;
          }
          return p + 3;
        });
      }, 20);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  // Run Resume tailoring
  useEffect(() => {
    if (activeTab === "assets") {
      setIsTailoring(true);
      setTailorModified("Managed database instances and wrote data retrieval queries.");
      const timer = setTimeout(() => {
        setTailorModified(
          "Architected FAISS vector indexing pipelines and standardized embedding parameters, reducing data retrieval query latency by 42%."
        );
        setIsTailoring(false);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Run Interview Star answer generator
  useEffect(() => {
    if (activeTab === "interview") {
      setIsAnswering(true);
      setInterviewText("");
      const fullAnswer = 
        "SITUATION: We noticed a mismatch in the dimension sizes of vector database embeddings during candidate data ingestion.\n\n" +
        "TASK: Align FAISS indexes to support multi-model standard formats.\n\n" +
        "ACTION: Implemented a normalization migration layer to standardise outputs.\n\n" +
        "RESULT: Reduced search mismatch errors to zero.";
      let charIdx = 0;
      const timer = setInterval(() => {
        if (charIdx < fullAnswer.length) {
          setInterviewText(fullAnswer.substring(0, charIdx + 4));
          charIdx += 4;
        } else {
          clearInterval(timer);
          setIsAnswering(false);
        }
      }, 20);
      return () => clearInterval(timer);
    }
  }, [activeTab]);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-lift overflow-hidden flex flex-col max-w-full text-left">
      {/* Top Safari-like Browser Bar */}
      <div className="bg-[#FAF9F5] border-b border-border/60 px-4 py-3 flex items-center justify-between gap-3 select-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="h-3 w-3 rounded-full bg-[#ff5f56] inline-block shadow-sm"></span>
          <span className="h-3 w-3 rounded-full bg-[#ffbd2e] inline-block shadow-sm"></span>
          <span className="h-3 w-3 rounded-full bg-[#27c93f] inline-block shadow-sm"></span>
        </div>
        <div className="bg-[#FAF9F5]/40 border border-border/60 rounded-lg px-6 md:px-24 py-1 text-[11px] text-muted-foreground/80 font-mono text-center truncate flex-1 max-w-md mx-auto flex items-center justify-center gap-1.5">
          <span className="text-[10px] opacity-40">🔒</span>
          <span>careeros.dev/dashboard/jobs</span>
        </div>
        <div className="flex gap-2 text-muted-foreground/60 shrink-0 text-xs">
          <span>⤗</span>
          <span>⊞</span>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex flex-col md:flex-row min-h-[460px] bg-background">
        {/* Left Mini Sidebar */}
        <aside className="w-full md:w-56 border-b md:border-b-0 md:border-r border-border/40 p-4 space-y-6 bg-[#FAF9F5]/20">
          <div className="flex items-center gap-2 px-2">
            <div className="h-6 w-6 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <span className="font-display text-base text-foreground font-semibold">CareerOS Dashboard</span>
          </div>
          
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab("discovery");
                setDiscoverPhase("idle");
                setDiscoverUrl("");
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors font-medium cursor-pointer ${
                activeTab === "discovery"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Search className="h-3.5 w-3.5" /> Discovery Clip
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab("match")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors font-medium cursor-pointer ${
                activeTab === "match"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Target className="h-3.5 w-3.5" /> Match Ranking
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab("assets")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors font-medium cursor-pointer ${
                activeTab === "assets"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Wand2 className="h-3.5 w-3.5" /> Tailor Resume
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab("skills")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors font-medium cursor-pointer ${
                activeTab === "skills"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5" /> Skill Learning
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>

            <button
              onClick={() => setActiveTab("interview")}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg transition-colors font-medium cursor-pointer ${
                activeTab === "interview"
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-muted-foreground hover:bg-muted/40 hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <Mic className="h-3.5 w-3.5" /> Interview STAR
              </span>
              <ChevronRight className="h-3 w-3 opacity-60" />
            </button>
          </nav>
        </aside>

        {/* Content Pane */}
        <main className="flex-1 p-6 flex flex-col justify-between">
          
          {/* Active Tab View: Discovery */}
          {activeTab === "discovery" && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <h4 className="font-display text-xl text-foreground font-semibold flex items-center gap-2">
                  <Search className="h-5 w-5 text-primary" /> Clip Jobs from the Internet
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Ingests job descriptions from LinkedIn, Google, or any web board instantly to sync baseline parameters.
                </p>
              </div>

              <div className="space-y-3 bg-[#FAF9F5]/30 border border-border/40 p-4 rounded-xl">
                <div className="text-xs font-medium text-muted-foreground">Scraper Browser Address</div>
                <div className="flex gap-2">
                  <div className="flex-1 bg-card border border-border/60 rounded-lg px-3 py-1.5 text-xs font-mono text-foreground flex items-center min-h-[32px] select-none">
                    {discoverUrl || <span className="text-muted-foreground/30 font-sans">Connecting parser...</span>}
                    {discoverPhase === "typing" && <span className="h-3.5 w-1.5 bg-primary ml-0.5 animate-typing border-l"></span>}
                  </div>
                  <button 
                    onClick={() => {
                      setDiscoverPhase("idle");
                      setTimeout(() => {
                        const targetUrl = "https://careers.google.com/jobs/ai-platform-engineer";
                        setDiscoverPhase("typing");
                        setDiscoverUrl("");
                        let i = 0;
                        const timer = setInterval(() => {
                          if (i < targetUrl.length) {
                            setDiscoverUrl((prev) => prev + targetUrl.charAt(i));
                            i++;
                          } else {
                            clearInterval(timer);
                            setDiscoverPhase("indexing");
                          }
                        }, 30);
                      }, 100);
                    }}
                    className="px-3 bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors border border-border/60 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" /> Re-run
                  </button>
                </div>

                {/* Simulated Parser Output Skeletons */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">Scraper Status</span>
                    {discoverPhase === "indexing" && (
                      <span className="text-primary font-mono animate-pulse">Extracting metadata...</span>
                    )}
                    {discoverPhase === "complete" && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Grounding Complete
                      </span>
                    )}
                    {discoverPhase === "typing" && (
                      <span className="text-muted-foreground font-mono">Inputting URL...</span>
                    )}
                    {discoverPhase === "idle" && (
                      <span className="text-muted-foreground">Ready</span>
                    )}
                  </div>

                  {/* Shimmery Skeletons */}
                  {(discoverPhase === "indexing" || discoverPhase === "idle") && (
                    <div className="space-y-2">
                      <div className="h-3.5 w-full rounded bg-muted/60 animate-shimmer"></div>
                      <div className="h-3.5 w-5/6 rounded bg-muted/60 animate-shimmer"></div>
                    </div>
                  )}

                  {discoverPhase === "complete" && (
                    <div className="space-y-2 animate-fade-in-up">
                      <div className="text-xs bg-primary/5 border border-primary/20 rounded-lg p-2.5 space-y-1">
                        <div className="font-semibold text-foreground">AI Platform Engineer</div>
                        <div className="text-[11px] text-muted-foreground">Google Cloud — Sunnyvale, CA</div>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-secondary/60 text-secondary-foreground border border-border/60 rounded text-[10px] font-mono">LLMs</span>
                        <span className="px-2 py-0.5 bg-secondary/60 text-secondary-foreground border border-border/60 rounded text-[10px] font-mono">Python/PyTorch</span>
                        <span className="px-2 py-0.5 bg-secondary/60 text-secondary-foreground border border-border/60 rounded text-[10px] font-mono">Vector Embeddings</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Active Tab View: Match */}
          {activeTab === "match" && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <h4 className="font-display text-xl text-foreground font-semibold flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" /> Match & Rank Jobs
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Scores job requirements against your private knowledge base to highlight key alignment points.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Dial Indicator */}
                <div className="bg-[#FAF9F5]/30 border border-border/40 p-4 rounded-xl flex flex-col items-center justify-center space-y-3 min-h-[160px]">
                  <div className="relative h-24 w-24 flex items-center justify-center">
                    <svg className="absolute inset-0 transform -rotate-90 w-full h-full" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" stroke="var(--border)" strokeWidth="8" fill="none" opacity="0.3" />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="var(--primary)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray="251"
                        strokeDashoffset={251 - (251 * matchProgress) / 100}
                        className="transition-all duration-300 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-2xl font-display text-foreground font-semibold">{matchProgress}%</span>
                  </div>
                  <div className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider">Fit Rank Match</div>
                </div>

                {/* Score Explainer */}
                <div className="bg-[#FAF9F5]/30 border border-border/40 p-4 rounded-xl space-y-2 flex flex-col justify-center">
                  <div className="text-xs font-semibold text-foreground">Score Assessment:</div>
                  <div className="space-y-1.5 text-xs text-muted-foreground leading-relaxed">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 inline-block"></span>
                      <span>Baselines: <strong>100% Core fit</strong> (Sunnyvale, CA, Hybrid)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 inline-block"></span>
                      <span>Skills match: <strong>91% matches</strong> (Pytorch, Python)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-600 inline-block"></span>
                      <span>Missing knowledge tags: <strong>Vector DBs (FAISS)</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Tab View: Assets */}
          {activeTab === "assets" && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <h4 className="font-display text-xl text-foreground font-semibold flex items-center gap-2">
                  <Wand2 className="h-5 w-5 text-primary" /> Tailor Resumes & Cover Letters
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Adjusts specific document sections to match job search requirements, preserving your true experience.
                </p>
              </div>

              <div className="space-y-3 bg-[#FAF9F5]/30 border border-border/40 p-4 rounded-xl">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Dynamic Bullet Optimization</div>
                <div className="space-y-2">
                  <div className="text-xs bg-muted/30 border border-border/60 p-2.5 rounded-lg">
                    <div className="text-[10px] text-muted-foreground font-semibold uppercase">Original Baseline Resume Bullet</div>
                    <div className="text-foreground mt-1 line-through opacity-60 font-sans">{tailorOriginal}</div>
                  </div>

                  <div className="text-xs bg-primary/5 border border-primary/20 p-2.5 rounded-lg relative overflow-hidden">
                    <div className="text-[10px] text-primary font-semibold uppercase">AI Tailored Optimization</div>
                    {isTailoring ? (
                      <div className="space-y-2 mt-2">
                        <div className="h-3 w-5/6 rounded bg-muted/60 animate-shimmer"></div>
                        <div className="h-3 w-2/3 rounded bg-muted/60 animate-shimmer"></div>
                      </div>
                    ) : (
                      <div className="text-foreground mt-1 font-sans animate-fade-in-up">
                        {tailorModified}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Tab View: Skills */}
          {activeTab === "skills" && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <h4 className="font-display text-xl text-foreground font-semibold flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" /> Skill Gap Learning Plans
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Identifies skill discrepancies and suggests personalized learning pathways to bridge them.
                </p>
              </div>

              <div className="space-y-3 bg-[#FAF9F5]/30 border border-border/40 p-4 rounded-xl">
                <div className="flex items-center justify-between border-b border-border/40 pb-2">
                  <span className="text-xs font-semibold text-foreground">Active Skill Gaps</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setActiveSkill("faiss")}
                      className={`px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                        activeSkill === "faiss" ? "bg-primary text-primary-foreground font-semibold" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      FAISS Vector DBs
                    </button>
                    <button
                      onClick={() => setActiveSkill("agent")}
                      className={`px-2 py-0.5 text-[10px] rounded transition-colors cursor-pointer ${
                        activeSkill === "agent" ? "bg-primary text-primary-foreground font-semibold" : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      Multi-Agent Loops
                    </button>
                  </div>
                </div>

                {activeSkill === "faiss" && (
                  <div className="space-y-2.5 animate-fade-in-up">
                    <div className="text-xs">
                      <span className="font-semibold text-foreground">Gap Level:</span> <span className="text-amber-700 font-medium font-mono bg-amber-50 px-1 border border-amber-200 rounded text-[10px]">Moderate</span>
                    </div>
                    <div className="text-xs bg-card border border-border/60 rounded-lg p-2.5 space-y-1">
                      <div className="font-semibold text-foreground">Study Resource Plan:</div>
                      <div className="text-[11px] text-muted-foreground">Read Pinecone/Meta FAISS documentation on vector spaces & index structures.</div>
                    </div>
                    <div className="text-xs bg-card border border-border/60 rounded-lg p-2.5 space-y-1">
                      <div className="font-semibold text-foreground">Practical Exercise:</div>
                      <div className="text-[11px] text-muted-foreground">Initialize a local FAISS index inside a Python script and query it using OpenAI embeddings.</div>
                    </div>
                  </div>
                )}

                {activeSkill === "agent" && (
                  <div className="space-y-2.5 animate-fade-in-up">
                    <div className="text-xs">
                      <span className="font-semibold text-foreground">Gap Level:</span> <span className="text-red-700 font-medium font-mono bg-red-50 px-1 border border-red-200 rounded text-[10px]">High</span>
                    </div>
                    <div className="text-xs bg-card border border-border/60 rounded-lg p-2.5 space-y-1">
                      <div className="font-semibold text-foreground">Study Resource Plan:</div>
                      <div className="text-[11px] text-muted-foreground">Read LangGraph documentation on cycles, state-saving memory, and graph persistence models.</div>
                    </div>
                    <div className="text-xs bg-card border border-border/60 rounded-lg p-2.5 space-y-1">
                      <div className="font-semibold text-foreground">Practical Exercise:</div>
                      <div className="text-[11px] text-muted-foreground">Build a basic LangGraph router containing validator and writer agents.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Tab View: Interview */}
          {activeTab === "interview" && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <h4 className="font-display text-xl text-foreground font-semibold flex items-center gap-2">
                  <Mic className="h-5 w-5 text-primary" /> Interview Prep STAR Drills
                </h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Drafts specific behavioral templates answering situational questions grounded in your achievements.
                </p>
              </div>

              <div className="space-y-3 bg-[#FAF9F5]/30 border border-border/40 p-4 rounded-xl">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Behavioral Scenario Question</div>
                <div className="text-xs bg-card border border-border/60 p-2.5 rounded-lg text-foreground font-sans">
                  "Tell me about a time you encountered mismatched dimensions in database structures."
                </div>

                <div className="bg-card border border-border/60 rounded-lg p-3 min-h-[120px] max-h-[160px] overflow-y-auto font-mono text-[10px] text-primary leading-relaxed whitespace-pre-wrap select-none relative">
                  {interviewText}
                  {isAnswering && <span className="h-3 w-1.5 bg-primary ml-0.5 animate-typing border-l"></span>}
                </div>
              </div>
            </div>
          )}

          {/* Interactive footer actions inside browser mockup */}
          <div className="flex items-center justify-between pt-4 border-t border-border/40 mt-4 text-[10px] font-mono text-muted-foreground/60">
            <div>
              <span>Select links in sidebar to view live simulation runs</span>
            </div>
            <div>
              <span className="text-primary font-semibold">Ready to test</span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-accent-foreground font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground group-hover:scale-105 transition-transform">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="font-display text-2xl tracking-tight text-primary">CareerOS</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#simulator" className="transition-colors hover:text-foreground">Interactive Demo</a>
            <a href="#how-to-apply" className="transition-colors hover:text-foreground">Application Guide</a>
            <a href="#features" className="transition-colors hover:text-foreground">Core Features</a>
          </nav>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="text-sm font-medium">
              <Link to="/login">Sign in</Link>
            </Button>
            <Button asChild size="sm" className="shadow-soft text-sm font-medium">
              <Link to="/register">Get started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Animated Background Blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <div 
            className="absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-accent/10 blur-[120px] animate-pulse-glow"
            style={{ animationDelay: "0s" }}
          />
          <div 
            className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow"
            style={{ animationDelay: "2.5s" }}
          />
        </div>

        <div className="mx-auto max-w-6xl px-6 pt-20 md:pt-28 text-center space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 backdrop-blur-sm px-4 py-1 text-xs font-semibold text-primary shadow-soft mx-auto font-sans">
            <Sparkles className="h-3.5 w-3.5 text-accent-foreground animate-float" /> Your AI Job-Search Copilot
          </div>
          <h1 className="font-display text-5xl tracking-tight md:text-7xl leading-tight max-w-4xl mx-auto">
            Land the role.
            <br />
            <span className="text-primary italic">Skip the busywork.</span>
          </h1>
          <p className="max-w-3xl mx-auto text-base md:text-lg text-muted-foreground leading-relaxed font-sans">
            Personalized job search grounded in your private knowledge base: discover roles from across the internet, calculate match ranks, tailor resumes and cover letters, explore career tracks, close skill gaps with curated learning resources, and prepare for interviews using custom behavioral STAR drills.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2 font-sans">
            <Button asChild size="lg" className="shadow-lift px-8">
              <Link to="/register">
                Start tailored search <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-8 bg-transparent border-border">
              <Link to="/login">I have an account</Link>
            </Button>
          </div>
          
          {/* Quick stats panel */}
          <div className="pt-8 border-t border-border/60 grid grid-cols-3 gap-6 max-w-2xl mx-auto font-sans">
            <div>
              <div className="text-3xl font-display text-primary">10x</div>
              <div className="text-xs text-muted-foreground mt-0.5">Application speed</div>
            </div>
            <div>
              <div className="text-3xl font-display text-primary">Browser Ext.</div>
              <div className="text-xs text-muted-foreground mt-0.5">Clip jobs in 1-click</div>
            </div>
            <div>
              <div className="text-3xl font-display text-primary">STAR Drills</div>
              <div className="text-xs text-muted-foreground mt-0.5">Practice story answers</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Guide: Step-by-Step effectively apply section */}
      <section id="how-to-apply" className="border-b border-border bg-muted/20 py-24 relative">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-3xl space-y-3">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Workflow Strategy</div>
            <h2 className="font-display text-4xl tracking-tight md:text-5xl">
              How to effectively apply for jobs step-by-step
            </h2>
            <p className="text-muted-foreground text-sm max-w-xl">
              Most job seekers fail by blindly spamming applications. Follow our proven, structured checklist to convert submissions into interviews.
            </p>
          </div>

          {/* Stepper Interactive Checklist */}
          <div className="mt-16 grid gap-6 md:grid-cols-5 relative">
            
            {/* Step 1 */}
            <div className="bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold">
                  01
                </div>
                <h3 className="font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors">Assess the Match</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Upload your master profile. Paste job URLs to calculate your skill & semantic match. Apply <strong>only</strong> if fit score is above 70% to save time.
                </p>
              </div>
              <div className="text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto">
                <Target className="h-3 w-3" /> Focus on high-fit targets
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold">
                  02
                </div>
                <h3 className="font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors">Optimize Keywords</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Tailor your resume highlighting core achievements matching the job post. Keep formatting clean and remove any columns that confuse parsing.
                </p>
              </div>
              <div className="text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto">
                <Sliders className="h-3 w-3" /> Beat the parser check
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold">
                  03
                </div>
                <h3 className="font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors">Draft a Hook</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Draft cover letters mapping exactly to their pain points. Detail specific projects from your background that solve problems they described.
                </p>
              </div>
              <div className="text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto">
                <Wand2 className="h-3 w-3" /> Relate experience directly
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold">
                  04
                </div>
                <h3 className="font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors">Audit & Cleanse</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Run a secondary automated quality check. Eliminate grammar issues, verify strong action verbs, and ensure impact values are quantified.
                </p>
              </div>
              <div className="text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto">
                <ShieldCheck className="h-3 w-3" /> Zero formatting issues
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-card border border-border hover:border-primary/40 transition-colors rounded-2xl p-6 space-y-4 relative flex flex-col justify-between group">
              <div>
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-display text-lg font-bold">
                  05
                </div>
                <h3 className="font-display text-xl text-foreground mt-4 group-hover:text-primary transition-colors">Practice STAR Drills</h3>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  Prepare STAR frameworks (Situation, Task, Action, Result) mapped to critical requirements. Practice speaking answers using real drills.
                </p>
              </div>
              <div className="text-[10px] text-primary/80 font-mono flex items-center gap-1.5 pt-4 border-t border-border/40 mt-auto">
                <Mic className="h-3 w-3" /> Ready for conversations
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24 space-y-16 animate-fade-in-up">
        <div className="max-w-2xl text-left space-y-3">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Core Utilities</div>
          <h2 className="font-display text-4xl tracking-tight md:text-5xl">
            Smarter tooling built for the modern application cycle
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft flex flex-col justify-between group"
            >
              <div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl text-foreground group-hover:text-primary transition-colors">{f.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
              <div className="border-t border-border/40 pt-4 mt-6 text-[10px] uppercase font-mono tracking-wider text-muted-foreground/60">
                {f.meta}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Box */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="overflow-hidden rounded-3xl border border-border bg-gradient-primary px-8 py-16 text-center text-primary-foreground shadow-lift relative md:py-24">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-accent/20 blur-3xl -z-10" />
          <h2 className="font-display text-4xl tracking-tight md:text-6xl text-primary-foreground">
            Take command of your search.
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm md:text-base text-primary-foreground/85">
            Free to get started. Build tailored profiles, prep STAR answers, and get direct evaluation feedback instantly.
          </p>
          <div className="mt-8 flex justify-center gap-3 flex-wrap">
            <Button asChild size="lg" variant="secondary" className="px-8 font-medium">
              <Link to="/register">Create free account <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-xs text-muted-foreground md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Briefcase className="h-3.5 w-3.5" />
            </div>
            <span className="font-display text-lg tracking-tight text-primary">CareerOS</span>
          </div>
          <div className="flex gap-6">
            <a href="#simulator" className="hover:text-foreground transition-colors">Simulator</a>
            <a href="#how-to-apply" className="hover:text-foreground transition-colors">Guide</a>
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          </div>
          <div>
            <span>© {new Date().getFullYear()} CareerOS. Crafted for career acceleration.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const features = [
  {
    icon: Search,
    title: "Intelligent Extraction",
    desc: "Simply import any job posting URL. Our parser extracts the critical tasks, target requirements, and company mission.",
    meta: "Automated scraping"
  },
  {
    icon: Sparkles,
    title: "Semantic Match Scoring",
    desc: "Calculate a structural match percentage. Understand where your profile aligns and what technical gaps are present.",
    meta: "Semantic parsing"
  },
  {
    icon: Wand2,
    title: "ATS-Grade Resumes",
    desc: "Adjust and compile tailored PDF resumes and cover letters designed to align with matching search queries.",
    meta: "Interactive compiler"
  },
  {
    icon: ShieldCheck,
    title: "Double-Agent Verification",
    desc: "A secondary review pass flags formatting concerns, missing active verbs, and filters out awkward phrasing.",
    meta: "Guardrail critique"
  },
  {
    icon: Mic,
    title: "Structured STAR Drills",
    desc: "Create custom behavioral drill practice templates based directly on achievements highlighted on your profile.",
    meta: "Voice prep integration"
  },
  {
    icon: FileText,
    title: "Document Library",
    desc: "Centralize profile iterations, job description parameters, and tailored cover letters in a clean local vault.",
    meta: "Secure database vault"
  }
];
