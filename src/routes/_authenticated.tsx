import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ApplyAgent } from "@/components/apply-agent";
import { AgentContextProvider } from "@/hooks/use-agent-context";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/login", replace: true });
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  return (
    <AgentContextProvider>
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-hidden bg-background">
          <AppSidebar />
          <SidebarInset className="flex flex-1 flex-col h-full overflow-hidden">
            <main className="flex-1 overflow-auto h-full">
              <Outlet />
            </main>
          </SidebarInset>
        </div>
        <ApplyAgent />
      </SidebarProvider>
    </AgentContextProvider>
  );
}
