import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider, u as useQueryClient } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent } from "../_libs/tanstack__react-router.mjs";
import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { s as supabase } from "./client-CCMK3uGO.mjs";
import { T as Toaster$1 } from "../_libs/sonner.mjs";
import { streamText, convertToModelMessages } from "../_libs/ai.mjs";
import { getGateway } from "./ai-gateway.server-B3gvEtJS.mjs";
import { g as objectType, i as stringType, B as recordType, C as anyType } from "../_libs/zod.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/@vercel/oidc.mjs";
import "os";
import "path";
import "fs";
import "../_libs/opentelemetry__api.mjs";
import "../_libs/ai-sdk__mistral.mjs";
const appCss = "/assets/styles-COwGxv-H.css";
function reportAppError(error, context = {}) {
  console.error("[App Error]", error, {
    route: typeof window !== "undefined" ? window.location.pathname : void 0,
    ...context
  });
}
const AuthContext = reactExports.createContext({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {
  }
});
function AuthProvider({ children }) {
  const [session, setSession] = reactExports.useState(null);
  const [loading, setLoading] = reactExports.useState(true);
  reactExports.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  const signOut = async () => {
    await supabase.auth.signOut();
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AuthContext.Provider, { value: { user: session?.user ?? null, session, loading, signOut }, children });
}
const useAuth = () => reactExports.useContext(AuthContext);
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90",
        children: "Go home"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  reactExports.useEffect(() => {
    reportAppError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold tracking-tight text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: error.message }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          onClick: () => {
            router2.invalidate();
            reset();
          },
          className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90",
          children: "Try again"
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/", className: "inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent", children: "Go home" })
    ] })
  ] }) });
}
const Route$i = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CareerOS — Your AI Job Search Copilot" },
      { name: "description", content: "Discover jobs, generate ATS-friendly tailored resumes and cover letters, and apply faster with a human-in-the-loop AI copilot." },
      { property: "og:title", content: "CareerOS" },
      { property: "og:description", content: "AI-powered job search and application copilot." },
      { property: "og:type", content: "website" }
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Work+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap" },
      { rel: "stylesheet", href: appCss }
    ]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function AuthSync() {
  const router2 = useRouter();
  const queryClient = useQueryClient();
  reactExports.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router2.invalidate();
      queryClient.invalidateQueries();
    });
    return () => subscription.unsubscribe();
  }, [router2, queryClient]);
  return null;
}
function RootComponent() {
  const { queryClient } = Route$i.useRouteContext();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(AuthProvider, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AuthSync, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Toaster, {})
  ] }) });
}
const $$splitComponentImporter$d = () => import("./register-DybsHH68.mjs");
const Route$h = createFileRoute("/register")({
  head: () => ({
    meta: [{
      title: "Create account — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./login-DnkftjuU.mjs");
const Route$g = createFileRoute("/login")({
  head: () => ({
    meta: [{
      title: "Sign in — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("../_authenticated-BoFwvm_X.mjs");
const Route$f = createFileRoute("/_authenticated")({
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./index-5G8wpqRl.mjs");
const Route$e = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "CareerOS — Your AI Job Search Copilot"
    }, {
      name: "description",
      content: "Discover roles, tailor every application to your real resume, and prep interviews — all in one place. You approve every action."
    }, {
      property: "og:title",
      content: "CareerOS — AI Career Copilot"
    }, {
      property: "og:description",
      content: "Tailored resumes, ranked matches, interview prep. Grounded in your real experience."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const SYSTEM = `You are the **in-app Guide** for CareerOS — a friendly assistant whose ONLY job is to help users navigate and use this application.

You can:
- Explain features (resume upload, job search, ranking, tailoring, review queue, interview prep, analytics, settings).
- Tell users which page/sidebar item to open and what to click next.
- Answer questions about how their data flows through the app.
- Suggest the next useful step inside the product.

You CANNOT and MUST NOT:
- Apply to jobs, submit applications, or take any action on the user's behalf.
- Answer questions unrelated to this application (no general career advice, coding help, trivia). Politely redirect: "I can only help with using CareerOS."

Be warm, short, and concrete. Use small bullet lists and reference real UI labels (Dashboard, Jobs, Review, Documents, Career, Analytics, Settings). Format with markdown.`;
const Route$d = createFileRoute("/api/agent")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = await request.json();
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        let gateway;
        try {
          gateway = getGateway();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "AI unavailable";
          return new Response(msg, { status: 503 });
        }
        const result = streamText({
          model: gateway("google/gemini-2.5-flash"),
          system: SYSTEM,
          messages: await convertToModelMessages(messages)
        });
        return result.toUIMessageStreamResponse({
          originalMessages: messages
        });
      }
    }
  }
});
const $$splitComponentImporter$9 = () => import("../_authenticated.upload-CvttHMJS.mjs");
const Route$c = createFileRoute("/_authenticated/upload")({
  head: () => ({
    meta: [{
      title: "Add a document or job — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("../_authenticated.settings-COv_kX5c.mjs");
const Route$b = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{
      title: "Settings — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("../_authenticated.review-BY4wqn13.mjs");
const Route$a = createFileRoute("/_authenticated/review")({
  head: () => ({
    meta: [{
      title: "Review queue — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("../_authenticated.extension-Cbf_Xjix.mjs");
const Route$9 = createFileRoute("/_authenticated/extension")({
  head: () => ({
    meta: [{
      title: "Browser Extension — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("../_authenticated.documents-Cm5ME52r.mjs");
const Route$8 = createFileRoute("/_authenticated/documents")({
  head: () => ({
    meta: [{
      title: "Documents — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const Route$7 = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — CareerOS" }] })
});
const $$splitComponentImporter$4 = () => import("../_authenticated.career-CX1Udr_-.mjs");
const Route$6 = createFileRoute("/_authenticated/career")({
  head: () => ({
    meta: [{
      title: "Career discovery — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("../_authenticated.applications-BKlI5sp-.mjs");
const Route$5 = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [{
      title: "Applications — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("../_authenticated.analytics-CZzAdVt_.mjs");
const Route$4 = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [{
      title: "Analytics — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("../_authenticated.jobs.index-CW6Ka4NK.mjs");
const Route$3 = createFileRoute("/_authenticated/jobs/")({
  head: () => ({
    meta: [{
      title: "Jobs — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("../_authenticated.jobs._jobId-DM_fG4Zb.mjs");
const Route$2 = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({
    meta: [{
      title: "Job — CareerOS"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const InputSchema$1 = objectType({
  event_type: stringType().min(1).max(80),
  payload: recordType(stringType().min(1).max(200), anyType()).default({}),
  job_id: stringType().uuid().optional(),
  application_id: stringType().uuid().optional()
});
const CORS$1 = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
const Route$1 = createFileRoute("/api/public/extension/event")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS$1 }),
      POST: async ({ request }) => {
        const auth = request.headers.get("authorization") || "";
        const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
        if (!token) return new Response("Missing bearer", { status: 401, headers: CORS$1 });
        const { supabaseAdmin } = await import("./client.server-C4S8i4cn.mjs");
        const { data: userData, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !userData.user) return new Response("Invalid token", { status: 401, headers: CORS$1 });
        let body;
        try {
          body = InputSchema$1.parse(await request.json());
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS$1 }
          });
        }
        await supabaseAdmin.from("application_events").insert({
          user_id: userData.user.id,
          job_id: body.job_id ?? null,
          application_id: body.application_id ?? null,
          event_type: `ext.${body.event_type}`.slice(0, 80),
          payload: body.payload
        });
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS$1 }
        });
      }
    }
  }
});
const InputSchema = objectType({
  job_url: stringType().url().max(2e3).optional(),
  page_title: stringType().max(500).optional()
});
async function authUser(request) {
  const auth = request.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return { error: new Response("Missing bearer token", { status: 401 }) };
  const { supabaseAdmin } = await import("./client.server-C4S8i4cn.mjs");
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return { error: new Response("Invalid token", { status: 401 }) };
  return { userId: data.user.id, supabaseAdmin };
}
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization"
};
const Route = createFileRoute("/api/public/extension/context")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS }),
      POST: async ({ request }) => {
        const auth = await authUser(request);
        if ("error" in auth) return auth.error;
        const { userId, supabaseAdmin } = auth;
        let parsed;
        try {
          parsed = InputSchema.parse(await request.json().catch(() => ({})));
        } catch (e) {
          return new Response(JSON.stringify({ error: e.message }), {
            status: 400,
            headers: { "Content-Type": "application/json", ...CORS }
          });
        }
        const { data: profile } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
        let job = null;
        let application = null;
        if (parsed.job_url) {
          const { data: jobs } = await supabaseAdmin.from("jobs").select("id, title, company, source_url").eq("user_id", userId).eq("source_url", parsed.job_url).limit(1);
          job = jobs?.[0] ?? null;
          if (job) {
            const { data: apps } = await supabaseAdmin.from("job_applications").select("id, answers, cover_letter, tailored_resume").eq("user_id", userId).eq("job_id", job.id).limit(1);
            application = apps?.[0] ?? null;
          }
        }
        const { data: resumeDoc } = await supabaseAdmin.from("documents").select("extracted_text").eq("user_id", userId).eq("kind", "resume").eq("is_primary", true).limit(1).maybeSingle();
        const fullName = profile?.full_name ?? "";
        const [firstName, ...rest] = fullName.split(/\s+/);
        const lastName = rest.join(" ");
        const body = {
          profile: {
            full_name: fullName,
            first_name: firstName || "",
            last_name: lastName || "",
            email: profile?.email ?? "",
            phone: profile?.phone ?? "",
            location: profile?.location ?? "",
            linkedin_url: profile?.linkedin_url ?? "",
            portfolio_url: profile?.portfolio_url ?? "",
            work_authorization: profile?.work_authorization ?? "",
            requires_sponsorship: profile?.requires_sponsorship ? "yes" : "no"
          },
          answers: {
            ...application?.answers ?? {},
            cover_letter: application?.cover_letter ?? "",
            resume_text: resumeDoc?.extracted_text ?? application?.tailored_resume ?? ""
          },
          job,
          application_id: application?.id ?? null
        };
        await supabaseAdmin.from("application_events").insert({
          user_id: userId,
          job_id: job?.id ?? null,
          application_id: application?.id ?? null,
          event_type: "extension_context_fetched",
          payload: { job_url: parsed.job_url, page_title: parsed.page_title }
        });
        return new Response(JSON.stringify(body), {
          status: 200,
          headers: { "Content-Type": "application/json", ...CORS }
        });
      }
    }
  }
});
const RegisterRoute = Route$h.update({
  id: "/register",
  path: "/register",
  getParentRoute: () => Route$i
});
const LoginRoute = Route$g.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$i
});
const AuthenticatedRoute = Route$f.update({
  id: "/_authenticated",
  getParentRoute: () => Route$i
});
const IndexRoute = Route$e.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$i
});
const ApiAgentRoute = Route$d.update({
  id: "/api/agent",
  path: "/api/agent",
  getParentRoute: () => Route$i
});
const AuthenticatedUploadRoute = Route$c.update({
  id: "/upload",
  path: "/upload",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedSettingsRoute = Route$b.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedReviewRoute = Route$a.update({
  id: "/review",
  path: "/review",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedExtensionRoute = Route$9.update({
  id: "/extension",
  path: "/extension",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDocumentsRoute = Route$8.update({
  id: "/documents",
  path: "/documents",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedDashboardRoute = Route$7.update({
  id: "/dashboard",
  path: "/dashboard",
  getParentRoute: () => AuthenticatedRoute
}).lazy(
  () => import("../_authenticated.dashboard.lazy-DRAEU_KB.mjs").then((d) => d.Route)
);
const AuthenticatedCareerRoute = Route$6.update({
  id: "/career",
  path: "/career",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedApplicationsRoute = Route$5.update({
  id: "/applications",
  path: "/applications",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedAnalyticsRoute = Route$4.update({
  id: "/analytics",
  path: "/analytics",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedJobsIndexRoute = Route$3.update({
  id: "/jobs/",
  path: "/jobs/",
  getParentRoute: () => AuthenticatedRoute
});
const AuthenticatedJobsJobIdRoute = Route$2.update({
  id: "/jobs/$jobId",
  path: "/jobs/$jobId",
  getParentRoute: () => AuthenticatedRoute
});
const ApiPublicExtensionEventRoute = Route$1.update({
  id: "/api/public/extension/event",
  path: "/api/public/extension/event",
  getParentRoute: () => Route$i
});
const ApiPublicExtensionContextRoute = Route.update({
  id: "/api/public/extension/context",
  path: "/api/public/extension/context",
  getParentRoute: () => Route$i
});
const AuthenticatedRouteChildren = {
  AuthenticatedAnalyticsRoute,
  AuthenticatedApplicationsRoute,
  AuthenticatedCareerRoute,
  AuthenticatedDashboardRoute,
  AuthenticatedDocumentsRoute,
  AuthenticatedExtensionRoute,
  AuthenticatedReviewRoute,
  AuthenticatedSettingsRoute,
  AuthenticatedUploadRoute,
  AuthenticatedJobsJobIdRoute,
  AuthenticatedJobsIndexRoute
};
const AuthenticatedRouteWithChildren = AuthenticatedRoute._addFileChildren(
  AuthenticatedRouteChildren
);
const rootRouteChildren = {
  IndexRoute,
  AuthenticatedRoute: AuthenticatedRouteWithChildren,
  LoginRoute,
  RegisterRoute,
  ApiAgentRoute,
  ApiPublicExtensionContextRoute,
  ApiPublicExtensionEventRoute
};
const routeTree = Route$i._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  Route$2 as R,
  router as r,
  useAuth as u
};
