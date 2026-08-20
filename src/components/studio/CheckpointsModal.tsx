import { useState } from "react";
import {
  Bookmark,
  Clock,
  History,
  RotateCcw,
  Plus,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ResumeContent } from "@/lib/resume";

export type CheckpointItem = {
  id: string;
  version: number;
  label: string;
  created_at: string;
  content: ResumeContent;
  template_id?: string | undefined;
  source?: "agent" | "manual" | "user" | "initial" | undefined;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  checkpoints: CheckpointItem[];
  currentContent: ResumeContent;
  onCreateCheckpoint: (label: string) => Promise<void>;
  onRevert: (checkpoint: CheckpointItem) => void;
  isSaving?: boolean | undefined;
};

export function CheckpointsModal({
  open,
  onOpenChange,
  checkpoints,
  onCreateCheckpoint,
  onRevert,
  isSaving = false,
}: Props) {
  const [newLabel, setNewLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmRevertId, setConfirmRevertId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setIsSubmitting(true);
    try {
      await onCreateCheckpoint(newLabel.trim());
      setNewLabel("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
      if (diffDays === 1) return "Yesterday";
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl rounded-3xl p-6 shadow-2xl">
        <DialogHeader className="pb-3 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <History className="size-5" />
            </div>
            <div>
              <DialogTitle className="font-display text-xl font-bold text-foreground">
                Resume Checkpoints & History
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Save version snapshots, track AI enhancements, and instantly revert to any checkpoint.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Create new checkpoint bar */}
        <form onSubmit={handleCreate} className="mt-4 flex gap-2">
          <Input
            id="checkpoint-label-input"
            placeholder="e.g. Before tailoring for Google, Tailored v2 with TypeScript"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="rounded-xl border-border text-xs focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <Button
            id="create-checkpoint-btn"
            type="submit"
            size="sm"
            disabled={!newLabel.trim() || isSubmitting || isSaving}
            className="shrink-0 h-10 rounded-xl px-4 font-semibold shadow-sm hover:shadow-md transition-all"
          >
            <Plus className="size-4" /> Save Checkpoint
          </Button>
        </form>

        {/* Timeline list */}
        <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-3 pr-1">
          {checkpoints.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bookmark className="size-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No checkpoints saved yet</p>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                Save a manual snapshot above, or let the AI Agent create checkpoints whenever you accept tailored revisions.
              </p>
            </div>
          ) : (
            checkpoints.map((cp, idx) => {
              const expCount = cp.content.experience?.length || 0;
              const skillCount = (cp.content.skills || []).reduce(
                (acc, s) => acc + (s.items?.length || 0),
                0,
              );
              const isConfirming = confirmRevertId === cp.id;

              return (
                <div
                  key={cp.id}
                  className={cn(
                    "rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-md",
                    idx === 0 && "ring-1 ring-primary/30 bg-primary/[0.02]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-foreground">
                          v{cp.version}
                        </span>
                        <span className="font-semibold text-sm text-foreground truncate">
                          {cp.label}
                        </span>
                        {idx === 0 && (
                          <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                            Latest
                          </Badge>
                        )}
                        {cp.source === "agent" && (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            <Sparkles className="mr-1 size-2.5" /> AI Agent
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="size-3" />
                          {formatRelativeTime(cp.created_at)}
                        </span>
                        <span>•</span>
                        <span>{expCount} role{expCount !== 1 ? "s" : ""}</span>
                        <span>•</span>
                        <span>{skillCount} skill{skillCount !== 1 ? "s" : ""}</span>
                        {cp.content.contact?.title && (
                          <>
                            <span>•</span>
                            <span className="truncate max-w-[160px]">{cp.content.contact.title}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="shrink-0 flex items-center gap-2">
                      {isConfirming ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              onRevert(cp);
                              setConfirmRevertId(null);
                              onOpenChange(false);
                            }}
                            className="h-8 px-3 rounded-lg text-xs font-semibold shadow-sm"
                          >
                            Confirm Revert
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setConfirmRevertId(null)}
                            className="h-8 px-2.5 rounded-lg text-xs"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setConfirmRevertId(cp.id)}
                          className="h-8 px-3 rounded-xl text-xs font-semibold hover:bg-primary hover:text-white transition-all shadow-xs"
                        >
                          <RotateCcw className="mr-1.5 size-3.5" /> Revert
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
