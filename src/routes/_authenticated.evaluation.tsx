import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import { 
  Play, 
  Terminal, 
  History, 
  CheckCircle2, 
  XCircle, 
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  FlaskConical,
  RotateCw
} from "lucide-react";
import { 
  getEvaluationHistory, 
  getEvaluationStatus, 
  runRagasEvaluation 
} from "@/lib/evaluation.functions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export const Route = createFileRoute("/_authenticated/evaluation")({
  head: () => ({ meta: [{ title: "RAG Evaluation — CareerOS" }] }),
  component: EvaluationPage,
});

function CircularProgress({ 
  value, 
  label, 
  colorClass = "text-primary",
  description
}: { 
  value: number; 
  label: string; 
  colorClass?: string;
  description: string;
}) {
  const percentage = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value * circumference);

  return (
    <Card className="flex flex-col items-center p-6 bg-card/65 backdrop-blur-sm border-border hover:shadow-md transition-all">
      <div className="relative flex h-28 w-28 items-center justify-center">
        <svg className="h-full w-full -rotate-90">
          <circle
            className="text-muted-foreground/10"
            strokeWidth="7"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="56"
            cy="56"
          />
          <circle
            className={`${colorClass} transition-all duration-500 ease-in-out`}
            strokeWidth="7"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx="56"
            cy="56"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold tracking-tight">{percentage}%</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        <h3 className="text-sm font-semibold tracking-tight">{label}</h3>
        <p className="mt-1 text-xs text-muted-foreground max-w-[150px] leading-snug">{description}</p>
      </div>
    </Card>
  );
}

function EvaluationPage() {
  const queryClient = useQueryClient();
  const getHistoryFn = useServerFn(getEvaluationHistory);
  const getStatusFn = useServerFn(getEvaluationStatus);
  const runEvalFn = useServerFn(runRagasEvaluation);

  // Queries
  const { data: history = [], isLoading: historyLoading } = useQuery({
    queryKey: ["evaluationHistory"],
    queryFn: () => getHistoryFn(),
  });

  const { data: runStatus, refetch: refetchStatus } = useQuery({
    queryKey: ["evaluationStatus"],
    queryFn: () => getStatusFn(),
  });

  // State
  const [isPolling, setIsPolling] = useState(false);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const logs = runStatus?.logs || "";
  const status = runStatus?.status || "idle";

  // Trigger evaluation
  const handleStartEvaluation = async () => {
    try {
      const res = await runEvalFn();
      if (res.success) {
        toast.success("Evaluation started");
        setIsPolling(true);
      } else {
        toast.error(res.message);
      }
      queryClient.invalidateQueries({ queryKey: ["evaluationStatus"] });
    } catch (err: any) {
      toast.error(err.message || "Failed to trigger evaluation");
    }
  };

  // Poll status while running
  useEffect(() => {
    if (status === "running") {
      setIsPolling(true);
    }
  }, [status]);

  useEffect(() => {
    let intervalId: any;
    if (isPolling) {
      intervalId = setInterval(async () => {
        const { data } = await refetchStatus();
        if (data && data.status !== "running") {
          setIsPolling(false);
          toast.success("Evaluation completed!");
          queryClient.invalidateQueries({ queryKey: ["evaluationHistory"] });
        }
      }, 1500);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isPolling, refetchStatus, queryClient]);

  // Auto-scroll logs terminal
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  const latestRun = history.length > 0 ? history[history.length - 1] : null;

  // Format history for Recharts
  const chartData = history.map((run) => ({
    date: new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + new Date(run.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    "Overall Score": Math.round(run.metrics.overall_score * 100),
    "Faithfulness": Math.round(run.metrics.faithfulness * 100),
    "Answer Relevancy": Math.round(run.metrics.answer_relevancy * 100),
    "Context Recall": Math.round(run.metrics.context_recall * 100),
    "Context Precision": Math.round(run.metrics.context_precision * 100),
  }));

  const getScoreColor = (val: number) => {
    if (val >= 0.85) return "text-emerald-500 stroke-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    if (val >= 0.7) return "text-amber-500 stroke-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-400";
    return "text-rose-500 stroke-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-400";
  };

  const getScoreBadge = (val: number) => {
    if (val >= 0.85) return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">Optimal</Badge>;
    if (val >= 0.7) return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">Acceptable</Badge>;
    return <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">Needs Polish</Badge>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight flex items-center gap-2">
            <FlaskConical className="h-8 w-8 text-primary" />
            LLM & RAG Evaluation
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Assess your copilot's accuracy, context relevance, and generation quality using Ragas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPolling && (
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground mr-2">
              <RotateCw className="h-3.5 w-3.5 animate-spin text-primary" />
              Evaluating with Ragas...
            </div>
          )}
          <Button 
            onClick={handleStartEvaluation} 
            disabled={isPolling || status === "running"}
            className="shadow-sm font-medium"
          >
            <Play className="mr-2 h-4 w-4 fill-current" />
            Run Evaluation
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {historyLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <RotateCw className="h-4 w-4 animate-spin text-primary" />
            Loading evaluation dashboard…
          </div>
        </div>
      ) : (
        <>
          {/* Status logs block (appears if running or has logs) */}
          {(status === "running" || status === "error" || isPolling || logs) && (
            <Card className="border-border shadow-sm">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm font-medium">Evaluation Console Logs</CardTitle>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      status === "running" ? "bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse" :
                      status === "finished" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      status === "error" ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                      "text-muted-foreground"
                    }
                  >
                    {status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                {status === "running" && (
                  <div className="mb-3">
                    <Progress value={undefined} className="h-1.5 bg-muted" />
                  </div>
                )}
                <div className="h-64 overflow-y-auto rounded-lg bg-zinc-950 p-4 font-mono text-xs text-zinc-200 border border-zinc-800 shadow-inner">
                  <pre className="whitespace-pre-wrap leading-relaxed">{logs || "Logs are empty. Click Run Evaluation to start."}</pre>
                  <div ref={terminalEndRef} />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Latest Metric Gauges */}
          {latestRun ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <CircularProgress 
                value={latestRun.metrics.overall_score} 
                label="Overall Ragas Score" 
                colorClass={getScoreColor(latestRun.metrics.overall_score).split(' ')[1]}
                description="Average score of all evaluated metrics combined."
              />
              <CircularProgress 
                value={latestRun.metrics.faithfulness} 
                label="Faithfulness" 
                colorClass={getScoreColor(latestRun.metrics.faithfulness).split(' ')[1]}
                description="Measures if the generated answer is strictly grounded in the retrieved context."
              />
              <CircularProgress 
                value={latestRun.metrics.answer_relevancy} 
                label="Answer Relevancy" 
                colorClass={getScoreColor(latestRun.metrics.answer_relevancy).split(' ')[1]}
                description="Measures how directly the answer addresses the user's question."
              />
              <CircularProgress 
                value={latestRun.metrics.context_precision} 
                label="Context Precision" 
                colorClass={getScoreColor(latestRun.metrics.context_precision).split(' ')[1]}
                description="Checks if the relevant chunks were prioritized and ranked correctly."
              />
              <CircularProgress 
                value={latestRun.metrics.context_recall} 
                label="Context Recall" 
                colorClass={getScoreColor(latestRun.metrics.context_recall).split(' ')[1]}
                description="Checks if all necessary information to answer the question was successfully retrieved."
              />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center bg-card/50">
              <Play className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
              <h3 className="font-semibold text-base">No Evaluation Runs Found</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm mx-auto">
                Start your first evaluation run to compute accuracy, faithfulness, and retrieval precision scores.
              </p>
              <Button onClick={handleStartEvaluation} className="mt-4">
                Run First Evaluation
              </Button>
            </div>
          )}

          {/* History Chart */}
          {history.length > 1 && (
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <History className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base font-semibold">Evaluation Trend Over Time</CardTitle>
                </div>
                <CardDescription>
                  Track how prompt modifications or chunking configuration updates impact Ragas metrics.
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="date" tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tickLine={false} tick={{ fill: "#6B7280", fontSize: 11 }} unit="%" />
                    <ChartTooltip 
                      contentStyle={{ backgroundColor: "#1F2937", border: "none", borderRadius: "8px", color: "#F9FAFB" }} 
                      labelStyle={{ fontWeight: "bold" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Line type="monotone" dataKey="Overall Score" stroke="#6366F1" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Faithfulness" stroke="#10B981" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Answer Relevancy" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="Context Recall" stroke="#EC4899" strokeWidth={1.5} strokeDasharray="5 5" dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Detailed Test Results */}
          {latestRun && (
            <Card className="border-border shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Detailed Run Breakdown</CardTitle>
                <CardDescription>
                  Drill down into the model's exact outputs, retrieved contexts, and calculated scores for each test case.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 font-medium text-muted-foreground text-xs uppercase tracking-wider">
                        <th className="p-4 pl-6">Test Query / Answer</th>
                        <th className="p-4 text-center">Faithfulness</th>
                        <th className="p-4 text-center">Answer Rel.</th>
                        <th className="p-4 text-center">Context Prec.</th>
                        <th className="p-4 text-center">Context Rec.</th>
                        <th className="p-4 text-right pr-6">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {latestRun.results.map((res, idx) => {
                        const isExpanded = expandedRow === idx;
                        const lowScoreWarning = 
                          res.scores.faithfulness < 0.7 || 
                          res.scores.answer_relevancy < 0.7 ||
                          res.scores.context_recall < 0.7;

                        return (
                          <React.Fragment key={idx}>
                            <tr className={`hover:bg-muted/30 transition-colors ${lowScoreWarning ? "bg-rose-500/5 hover:bg-rose-500/10" : ""}`}>
                              <td className="p-4 pl-6 max-w-md">
                                <div className="font-medium flex items-center gap-1.5">
                                  {lowScoreWarning && (
                                    <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                                  )}
                                  {res.question}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground line-clamp-2 italic">
                                  "{res.answer}"
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getScoreColor(res.scores.faithfulness).split(' ').slice(2).join(' ')}`}>
                                  {Math.round(res.scores.faithfulness * 100)}%
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getScoreColor(res.scores.answer_relevancy).split(' ').slice(2).join(' ')}`}>
                                  {Math.round(res.scores.answer_relevancy * 100)}%
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getScoreColor(res.scores.context_precision).split(' ').slice(2).join(' ')}`}>
                                  {Math.round(res.scores.context_precision * 100)}%
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getScoreColor(res.scores.context_recall).split(' ').slice(2).join(' ')}`}>
                                  {Math.round(res.scores.context_recall * 100)}%
                                </span>
                              </td>
                              <td className="p-4 text-right pr-6">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setExpandedRow(isExpanded ? null : idx)}
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </Button>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-muted/20">
                                <td colSpan={6} className="p-6 pl-12 pr-6 border-b border-border">
                                  <div className="space-y-4 text-sm leading-relaxed">
                                    {/* Warnings if any */}
                                    {lowScoreWarning && (
                                      <div className="flex items-center gap-2 p-3 rounded-lg border border-rose-500/20 bg-rose-500/10 text-xs text-rose-700 dark:text-rose-400 font-medium">
                                        <AlertTriangle className="h-4 w-4 shrink-0" />
                                        Warning: This test case scored below optimal thresholds. Review the answer alignment with context or enhance your documents.
                                      </div>
                                    )}

                                    {/* Ground Truth */}
                                    <div>
                                      <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Expected Ground Truth</h4>
                                      <div className="p-3 bg-card rounded-md border border-border">
                                        {res.ground_truth}
                                      </div>
                                    </div>

                                    {/* Actual Generated Answer */}
                                    <div>
                                      <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Generated Answer</h4>
                                      <div className="p-3 bg-card rounded-md border border-border font-medium">
                                        {res.answer}
                                      </div>
                                    </div>

                                    {/* Retrieved Context Chunks */}
                                    <div>
                                      <h4 className="text-xs uppercase font-bold tracking-wider text-muted-foreground mb-1">Retrieved Context (RAG Input)</h4>
                                      <div className="space-y-2">
                                        {res.contexts.map((chunk, cIdx) => (
                                          <div key={cIdx} className="p-3 bg-muted/65 rounded-md border border-border text-xs font-mono whitespace-pre-wrap leading-normal text-muted-foreground">
                                            <span className="font-semibold text-primary block mb-1">Chunk #{cIdx + 1}</span>
                                            {chunk}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// React import helper inside typescript
import * as React from "react";
