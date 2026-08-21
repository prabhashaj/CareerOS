import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  LayoutDashboard,
  FileText,
  Settings,
  Upload,
  LogOut,
  Sparkles,
  Mail,
  Mic,
  FolderOpen,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

const corePillars = [
  { title: "Resume Studio", url: "/studio", icon: Sparkles },
  { title: "Cover Letter Maker", url: "/cover-letter", icon: Mail },
  { title: "Interview Prep", url: "/interview", icon: Mic },
];

const workspace = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Target Roles & JDs", url: "/jobs", icon: Briefcase },
  { title: "My Resumes & Docs", url: "/resumes", icon: FolderOpen },
];

const account = [
  { title: "Upload & Enrich", url: "/upload", icon: Upload },
  { title: "Settings & Profile", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  const renderGroup = (label: string, items: typeof corePillars) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className="font-medium text-xs">{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center justify-between gap-1 p-2">
        <Link to="/dashboard" className="flex items-center gap-2 min-w-0 flex-1 px-1 py-1">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Briefcase className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight truncate">
              <div className="font-display text-base font-bold truncate">CareerOS</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60 truncate">AI Copilot</div>
            </div>
          )}
        </Link>
        <SidebarTrigger className="shrink-0 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" />
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("AI Superpowers", corePillars)}
        {renderGroup("Workspace", workspace)}
        {renderGroup("Account", account)}
      </SidebarContent>
      <SidebarFooter>
        {!collapsed && user && (
          <div className="truncate px-2 py-1 text-xs text-sidebar-foreground/60">{user.email}</div>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Sign out"
              onClick={async () => {
                await queryClient.cancelQueries();
                queryClient.clear();
                await signOut();
                navigate({ to: "/", replace: true });
              }}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="text-xs">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
