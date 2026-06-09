import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { B as Button, c as cn } from "./_ssr/button-DjOZMqFS.mjs";
import { B as Badge } from "./_ssr/badge-YM7oB01y.mjs";
import { s as supabase } from "./_ssr/client-CCMK3uGO.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { h as Puzzle, D as Download, s as Copy, t as Link2, u as CircleCheck, v as CircleAlert } from "./_libs/lucide-react.mjs";
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_libs/tailwind-merge.mjs";
import "./_libs/supabase__supabase-js.mjs";
import "./_libs/supabase__postgrest-js.mjs";
import "./_libs/supabase__realtime-js.mjs";
import "./_libs/supabase__phoenix.mjs";
import "./_libs/supabase__storage-js.mjs";
import "./_libs/iceberg-js.mjs";
import "./_libs/supabase__auth-js.mjs";
import "tslib";
import "./_libs/supabase__functions-js.mjs";
import "./_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
const Card = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      className: cn("rounded-xl border bg-card text-card-foreground shadow", className),
      ...props
    }
  )
);
Card.displayName = "Card";
const CardHeader = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("flex flex-col space-y-1.5 p-6", className), ...props })
);
CardHeader.displayName = "CardHeader";
const CardTitle = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref,
      className: cn("font-semibold leading-none tracking-tight", className),
      ...props
    }
  )
);
CardTitle.displayName = "CardTitle";
const CardDescription = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("text-sm text-muted-foreground", className), ...props })
);
CardDescription.displayName = "CardDescription";
const CardContent = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("p-6 pt-0", className), ...props })
);
CardContent.displayName = "CardContent";
const CardFooter = reactExports.forwardRef(
  ({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref, className: cn("flex items-center p-6 pt-0", className), ...props })
);
CardFooter.displayName = "CardFooter";
function ExtensionPage() {
  const [connectState, setConnectState] = reactExports.useState("idle");
  const [errMsg, setErrMsg] = reactExports.useState(null);
  reactExports.useEffect(() => {
    function onMsg(e) {
      if (e.source !== window) return;
      const m = e.data;
      if (!m || m.type !== "JOBPILOT_AUTH_ACK") return;
      if (m.ok) {
        setConnectState("connected");
        toast.success("Extension connected");
      } else {
        setConnectState("error");
        setErrMsg(m.error || "Extension did not respond. Is it installed and enabled?");
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);
  async function connect() {
    setConnectState("sending");
    setErrMsg(null);
    const {
      data,
      error
    } = await supabase.auth.getSession();
    if (error || !data.session) {
      setConnectState("error");
      setErrMsg("Not signed in.");
      return;
    }
    window.postMessage({
      type: "JOBPILOT_AUTH",
      payload: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.session.user.id,
          email: data.session.user.email
        },
        app_url: window.location.origin,
        api_url: window.location.origin
      }
    }, window.location.origin);
    setTimeout(() => {
      setConnectState((s) => s === "sending" ? (setErrMsg("No response from the extension. Make sure it's installed in this browser, then click Connect again."), "error") : s);
    }, 2500);
  }
  function download() {
    fetch("/jobpilot-extension.zip").then((res) => {
      if (!res.ok) throw new Error(`Download failed (${res.status})`);
      return res.blob();
    }).then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "jobpilot-extension.zip";
      a.click();
      URL.revokeObjectURL(a.href);
    }).catch((err) => toast.error(err.message));
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-3xl px-6 py-10 md:px-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { className: "h-3 w-3 text-accent" }),
      "Browser Extension"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl tracking-tight", children: "CareerOS Chrome extension" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 max-w-xl text-sm text-muted-foreground", children: "The extension reads your profile, resume, and saved answers from CareerOS, then auto-fills application forms in your own browser session. Nothing is submitted automatically — you review and click Submit yourself." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "1. Download the extension" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Badge, { variant: "secondary", className: "text-[10px]", children: "v0.1.1" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Get the packaged extension as a zip." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { onClick: download, size: "sm", className: "mt-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-1.5 h-3.5 w-3.5" }),
            "Download zip"
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Puzzle, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "2. Load it in Chrome" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Unzip the file." }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "Open",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("code", { className: "rounded bg-muted px-1 py-0.5 text-xs", children: "chrome://extensions" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "ml-1 inline-flex h-5 items-center rounded border border-border px-1.5 text-[10px] hover:bg-secondary", onClick: () => {
                navigator.clipboard.writeText("chrome://extensions");
                toast.success("Copied");
              }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "mr-0.5 h-2.5 w-2.5" }),
                " copy"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "Toggle ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Developer mode" }),
              " on (top-right)."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
              "Click ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Load unpacked" }),
              " and select the unzipped folder."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Works in Chrome, Edge, Brave, Arc, and other Chromium browsers." })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Card, { className: "p-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link2, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "3. Connect this account" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Click below to hand your signed-in session to the extension. Your access token never leaves your browser — it's stored in the extension and used to call the CareerOS API on your behalf." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: connect, size: "sm", disabled: connectState === "sending", children: connectState === "sending" ? "Sending…" : "Connect extension" }),
            connectState === "connected" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-success", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-3.5 w-3.5" }),
              "Connected"
            ] }),
            connectState === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-xs text-destructive", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "h-3.5 w-3.5" }),
              errMsg
            ] })
          ] })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Card, { className: "p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-medium", children: "4. Use it on any job site" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("ol", { className: "mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Open a job application (Greenhouse, Lever, Workday, Ashby, LinkedIn Easy Apply, etc.)." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Click the CareerOS icon in your browser toolbar." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { children: [
            "Click ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "Auto-fill this application" }),
            ". The extension fills every field it can map, and shows you exactly which fields were filled and which were skipped."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: "Review the filled values, fix anything you want, then submit yourself." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 rounded-md border border-border bg-secondary/50 p-3 text-xs text-muted-foreground", children: "The extension never clicks Submit. Every action is logged to your application timeline so you have an audit trail of what was filled on which site." })
      ] })
    ] })
  ] });
}
export {
  ExtensionPage as component
};
