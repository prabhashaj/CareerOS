import { r as reactExports, j as jsxRuntimeExports } from "./_libs/react.mjs";
import { L as Link } from "./_libs/tanstack__react-router.mjs";
import { u as useQueryClient, a as useQuery } from "./_libs/tanstack__react-query.mjs";
import { u as useServerFn } from "./_ssr/useServerFn-DL2oePlL.mjs";
import { t as toast } from "./_libs/sonner.mjs";
import { l as listDocuments, d as deleteDocument, g as getDocument, a as downloadDocument } from "./_ssr/documents.functions-CY_Z-ixU.mjs";
import { B as Button } from "./_ssr/button-DjOZMqFS.mjs";
import { D as Dialog, a as DialogContent, b as DialogHeader, c as DialogTitle, d as DialogFooter } from "./_ssr/dialog-DxnQwSo9.mjs";
import "./_libs/seroval.mjs";
import { w as Plus, F as FileText, x as Eye, n as Trash2, D as Download } from "./_libs/lucide-react.mjs";
import "./_libs/tanstack__router-core.mjs";
import "./_libs/tanstack__history.mjs";
import "./_libs/cookie-es.mjs";
import "./_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "./_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "./_libs/isbot.mjs";
import "./_libs/tanstack__query-core.mjs";
import "./_ssr/createSsrRpc-ZrE_UFSo.mjs";
import "./_ssr/server-BD-sNUlq.mjs";
import "node:async_hooks";
import "./_libs/h3-v2.mjs";
import "./_libs/rou3.mjs";
import "./_libs/srvx.mjs";
import "./_ssr/auth-middleware-C6u9Brrq.mjs";
import "./_libs/supabase__supabase-js.mjs";
import "./_libs/supabase__postgrest-js.mjs";
import "./_libs/supabase__realtime-js.mjs";
import "./_libs/supabase__phoenix.mjs";
import "./_libs/supabase__storage-js.mjs";
import "./_libs/iceberg-js.mjs";
import "./_libs/supabase__auth-js.mjs";
import "tslib";
import "./_libs/supabase__functions-js.mjs";
import "./_libs/zod.mjs";
import "./_libs/radix-ui__react-slot.mjs";
import "./_libs/radix-ui__react-compose-refs.mjs";
import "./_libs/class-variance-authority.mjs";
import "./_libs/clsx.mjs";
import "./_libs/tailwind-merge.mjs";
import "./_libs/radix-ui__react-dialog.mjs";
import "./_libs/radix-ui__primitive.mjs";
import "./_libs/radix-ui__react-context.mjs";
import "./_libs/radix-ui__react-id.mjs";
import "./_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "./_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "./_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "./_libs/radix-ui__react-primitive.mjs";
import "./_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "./_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "./_libs/radix-ui__react-focus-scope.mjs";
import "./_libs/radix-ui__react-portal.mjs";
import "./_libs/radix-ui__react-presence.mjs";
import "./_libs/radix-ui__react-focus-guards.mjs";
import "./_libs/react-remove-scroll.mjs";
import "./_libs/react-remove-scroll-bar.mjs";
import "./_libs/react-style-singleton.mjs";
import "./_libs/get-nonce.mjs";
import "./_libs/use-sidecar.mjs";
import "./_libs/use-callback-ref.mjs";
import "./_libs/aria-hidden.mjs";
function DocumentsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listDocuments);
  const del = useServerFn(deleteDocument);
  const get = useServerFn(getDocument);
  const downloadDoc = useServerFn(downloadDocument);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["documents"],
    queryFn: () => fn()
  });
  const [viewing, setViewing] = reactExports.useState(null);
  const [loadingId, setLoadingId] = reactExports.useState(null);
  const handleDelete = async (id) => {
    await del({
      data: {
        id
      }
    });
    toast.success("Removed");
    qc.invalidateQueries({
      queryKey: ["documents"]
    });
  };
  const handleDownload = async (id) => {
    setLoadingId(id);
    try {
      const response = await downloadDoc({
        data: {
          id
        }
      });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "";
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) {
          filename = match[1].replace(/['"]/g, "");
        }
      }
      if (!filename) {
        const mimeType = response.headers.get("Content-Type") || "application/octet-stream";
        const extension = mimeType.split("/")[1];
        filename = `document.${extension}`;
      }
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download");
    } finally {
      setLoadingId(null);
    }
  };
  const handleView = async (id) => {
    setLoadingId(id);
    try {
      const doc = await get({
        data: {
          id
        }
      });
      setViewing(doc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoadingId(null);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-8 flex items-end justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-semibold tracking-tight", children: "Documents" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Resumes and knowledge-base files." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/upload", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "mr-2 h-4 w-4" }),
        " Add document"
      ] }) })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Loading…" }) : data && data.length > 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-3 md:grid-cols-2", children: data.map((d) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between rounded-xl border border-border bg-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(FileText, { className: "h-5 w-5" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: d.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs uppercase tracking-wide text-muted-foreground", children: d.kind.replace("_", " ") }),
          d.is_primary && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-1 inline-block rounded bg-success/15 px-1.5 py-0.5 text-xs text-success", children: "Primary" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleView(d.id), disabled: loadingId === d.id, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-4 w-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { variant: "ghost", size: "sm", onClick: () => handleDelete(d.id), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
      ] })
    ] }, d.id)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No documents yet." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { asChild: true, className: "mt-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/upload", children: "Upload a resume" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open: !!viewing, onOpenChange: (o) => !o && setViewing(null), children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-3xl", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(DialogHeader, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { children: viewing?.title }) }),
      viewing?.extracted_text ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 text-sm", children: viewing.extracted_text }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "No extracted text stored for this document.",
        viewing?.signed_url ? " Use the download button to open the original file." : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogFooter, { children: [
        viewing?.signed_url && /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { variant: "outline", onClick: () => handleDownload(viewing?.id), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "mr-2 h-4 w-4" }),
          " Open original"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { onClick: () => setViewing(null), children: "Close" })
      ] })
    ] }) })
  ] });
}
export {
  DocumentsPage as component
};
