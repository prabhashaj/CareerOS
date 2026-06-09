import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { d as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { s as supabase } from "./client-CCMK3uGO.mjs";
import { u as useAuth } from "./router-ClvJc2re.mjs";
import { B as Button } from "./button-DjOZMqFS.mjs";
import { I as Input } from "./input-D_U8fI25.mjs";
import { L as Label } from "./label-C8WJLhmR.mjs";
import { B as Briefcase } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/ai.mjs";
import "../_libs/ai-sdk__gateway.mjs";
import "../_libs/ai-sdk__provider-utils.mjs";
import "../_libs/ai-sdk__provider.mjs";
import "../_libs/eventsource-parser.mjs";
import "../_libs/zod.mjs";
import "../_libs/@vercel/oidc.mjs";
import "os";
import "path";
import "fs";
import "../_libs/opentelemetry__api.mjs";
import "./ai-gateway.server-B3gvEtJS.mjs";
import "../_libs/ai-sdk__mistral.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
function LoginPage() {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [loading, setLoading] = reactExports.useState(false);
  reactExports.useEffect(() => {
    if (user) navigate({
      to: "/dashboard",
      replace: true
    });
  }, [user, navigate]);
  const handleEmailSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    const {
      error
    } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Welcome back!");
  };
  const handleGoogle = async () => {
    const {
      error
    } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/dashboard"
      }
    });
    if (error) toast.error(error.message ?? "Google sign-in failed");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "mb-8 flex items-center justify-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Briefcase, { className: "h-5 w-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-lg font-semibold", children: "CareerOS" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-semibold tracking-tight", children: "Welcome back" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Sign in to continue your search." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "outline", className: "mt-6 w-full", onClick: handleGoogle, children: "Continue with Google" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "my-6 flex items-center gap-3 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" }),
        " OR ",
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-px flex-1 bg-border" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handleEmailSignIn, className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "email", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", type: "email", required: true, value: email, onChange: (e) => setEmail(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Label, { htmlFor: "password", children: "Password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "password", type: "password", required: true, value: password, onChange: (e) => setPassword(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "submit", className: "w-full", disabled: loading, children: loading ? "Signing in…" : "Sign in" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-6 text-center text-sm text-muted-foreground", children: [
        "New here?",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/register", className: "text-primary hover:underline", children: "Create an account" })
      ] })
    ] })
  ] }) });
}
export {
  LoginPage as component
};
