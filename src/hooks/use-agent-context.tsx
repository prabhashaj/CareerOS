import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import type { ResumeContent, TemplateId } from "@/lib/resume";
import type { CheckpointItem } from "@/components/studio/CheckpointsModal";

export type AgentChatMessage = {
  id: string;
  role: "user" | "agent" | "assistant";
  text: string;
  changelog?: string[] | undefined;
  questions?: string[] | undefined;
  pendingResume?: ResumeContent | undefined;
  previousResume?: ResumeContent | undefined;
  isReverted?: boolean | undefined;
  timestamp?: number | undefined;
};

export type StudioJobContext = {
  id?: string | undefined;
  title?: string | undefined;
  company?: string | undefined;
  description?: string | null | undefined;
};

export type StudioSession = {
  content: ResumeContent;
  template: TemplateId;
  setContent: (c: ResumeContent | ((prev: ResumeContent) => ResumeContent)) => void;
  setTemplate: (t: TemplateId) => void;
  saveResume: (c: ResumeContent, tpl?: TemplateId) => Promise<void>;
  createCheckpoint: (
    label: string,
    customContent?: ResumeContent,
    source?: "agent" | "manual" | "user",
  ) => Promise<void>;
  handleRevertToCheckpoint: (checkpoint: CheckpointItem) => void;
  handleRevertLastChange: () => void;
  openCheckpointsModal: () => void;
  jobRow?: StudioJobContext | null | undefined;
  versions: CheckpointItem[];
  currentResumeId?: string | null | undefined;
};

type AgentContextType = {
  isStudioActive: boolean;
  jobContext: StudioJobContext | null;
  getStudioSession: () => StudioSession | null;
  registerStudioSession: (session: StudioSession) => () => void;
  updateStudioSession: (session: StudioSession) => void;
  messages: AgentChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AgentChatMessage[]>>;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
};

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentContextProvider({ children }: { children: React.ReactNode }) {
  const sessionRef = useRef<StudioSession | null>(null);
  const [isStudioActive, setIsStudioActive] = useState(false);
  const [jobContext, setJobContext] = useState<StudioJobContext | null>(null);
  const [messages, setMessages] = useState<AgentChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const getStudioSession = useCallback(() => sessionRef.current, []);

  const registerStudioSession = useCallback((session: StudioSession) => {
    sessionRef.current = session;
    setIsStudioActive(true);
    if (session.jobRow) {
      setJobContext(session.jobRow);
    }
    return () => {
      sessionRef.current = null;
      setIsStudioActive(false);
      setJobContext(null);
    };
  }, []);

  const updateStudioSession = useCallback((session: StudioSession) => {
    sessionRef.current = session;
    if (session.jobRow) {
      setJobContext((prev) =>
        prev?.id === session.jobRow?.id && prev?.title === session.jobRow?.title ? prev : (session.jobRow ?? null),
      );
    }
  }, []);

  const value = useMemo(
    () => ({
      isStudioActive,
      jobContext,
      getStudioSession,
      registerStudioSession,
      updateStudioSession,
      messages,
      setMessages,
      isChatOpen,
      setIsChatOpen,
    }),
    [
      isStudioActive,
      jobContext,
      getStudioSession,
      registerStudioSession,
      updateStudioSession,
      messages,
      isChatOpen,
    ],
  );

  return <AgentContext.Provider value={value}>{children}</AgentContext.Provider>;
}

export function useAgentContext() {
  const ctx = useContext(AgentContext);
  if (!ctx) {
    throw new Error("useAgentContext must be used within an AgentContextProvider");
  }
  return ctx;
}
