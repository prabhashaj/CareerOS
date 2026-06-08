import { Link, useRouterState } from "@tanstack/react-router";
import {
  Briefcase,
  LayoutDashboard,
  Search,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  BarChart3,
  Settings,
  Upload,
  LogOut,
  Puzzle,
  Compass,
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
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

const discovery = [
  { title: "Find jobs", url: "/jobs", icon: Search },
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Career discovery", url: "/career", icon: Compass },
];

const pipeline = [
  { title: "Applications", url: "/applications", icon: ClipboardCheck },
  { title: "Review queue", url: "/review", icon: ShieldCheck },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const library = [
  { title: "Documents", url: "/documents", icon: FileText },
  { title: "Upload", url: "/upload", icon: Upload },
  { title: "Browser extension", url: "/extension", icon: Puzzle },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isActive = (url: string) => pathname === url || pathname.startsWith(url + "/");

  const renderGroup = (label: string, items: typeof discovery) => (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.url}>
              <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                <Link to={item.url} className="flex items-center gap-2">
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
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
      <SidebarHeader>
        <Link to="/dashboard" className="flex items-center gap-2 px-2 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Briefcase className="h-4 w-4" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="font-display text-base font-bold">CareerOS</div>
              <div className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">AI Copilot</div>
            </div>
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {renderGroup("Discover", discovery)}
        {renderGroup("Pipeline", pipeline)}
        {renderGroup("Library", library)}
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
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
