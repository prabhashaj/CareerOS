import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Download, Puzzle, Link2, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/extension")({
  head: () => ({ meta: [{ title: "Browser Extension — CareerOS" }] }),
  component: ExtensionPage,
});

function ExtensionPage() {
  const [connectState, setConnectState] = useState<"idle" | "sending" | "connected" | "error">(
    "idle",
  );
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // Listen for ack from the extension content script
  useEffect(() => {
    function onMsg(e: MessageEvent) {
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
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
      setConnectState("error");
      setErrMsg("Not signed in.");
      return;
    }
    window.postMessage(
      {
        type: "JOBPILOT_AUTH",
        payload: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          user: { id: data.session.user.id, email: data.session.user.email },
          app_url: window.location.origin,
          api_url: window.location.origin,
        },
      },
      window.location.origin,
    );
    // Timeout fallback: if no ack within 2s, assume extension is missing.
    setTimeout(() => {
      setConnectState((s) =>
        s === "sending"
          ? (setErrMsg(
              "No response from the extension. Make sure it's installed in this browser, then click Connect again.",
            ),
            "error")
          : s,
      );
    }, 2500);
  }

  function download() {
    fetch("/jobpilot-extension.zip")
      .then((res) => {
        if (!res.ok) throw new Error(`Download failed (${res.status})`);
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "jobpilot-extension.zip";
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch((err) => toast.error(err.message));
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 md:px-10">
      <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
        <Puzzle className="h-3 w-3 text-accent" />
        Browser Extension
      </div>
      <h1 className="font-display text-3xl tracking-tight">CareerOS Chrome extension</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        The extension reads your profile, resume, and saved answers from
        CareerOS, then auto-fills application forms in your own browser
        session. Nothing is submitted automatically — you review and click
        Submit yourself.
      </p>

      <div className="mt-8 grid gap-4">
        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Download className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium">1. Download the extension</h3>
                <Badge variant="secondary" className="text-[10px]">
                  v0.1.1
                </Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Get the packaged extension as a zip.
              </p>
              <Button onClick={download} size="sm" className="mt-3">
                <Download className="mr-1.5 h-3.5 w-3.5" />
                Download zip
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Puzzle className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">2. Load it in Chrome</h3>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                <li>Unzip the file.</li>
                <li>
                  Open{" "}
                  <code className="rounded bg-muted px-1 py-0.5 text-xs">
                    chrome://extensions
                  </code>
                  <button
                    className="ml-1 inline-flex h-5 items-center rounded border border-border px-1.5 text-[10px] hover:bg-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText("chrome://extensions");
                      toast.success("Copied");
                    }}
                  >
                    <Copy className="mr-0.5 h-2.5 w-2.5" /> copy
                  </button>
                </li>
                <li>
                  Toggle <strong>Developer mode</strong> on (top-right).
                </li>
                <li>
                  Click <strong>Load unpacked</strong> and select the unzipped
                  folder.
                </li>
              </ol>
              <p className="mt-2 text-xs text-muted-foreground">
                Works in Chrome, Edge, Brave, Arc, and other Chromium browsers.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
              <Link2 className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium">3. Connect this account</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Click below to hand your signed-in session to the extension.
                Your access token never leaves your browser — it's stored in
                the extension and used to call the CareerOS API on your behalf.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <Button
                  onClick={connect}
                  size="sm"
                  disabled={connectState === "sending"}
                >
                  {connectState === "sending" ? "Sending…" : "Connect extension"}
                </Button>
                {connectState === "connected" && (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Connected
                  </span>
                )}
                {connectState === "error" && (
                  <span className="inline-flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-medium">4. Use it on any job site</h3>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>Open a job application (Greenhouse, Lever, Workday, Ashby, LinkedIn Easy Apply, etc.).</li>
            <li>Click the CareerOS icon in your browser toolbar.</li>
            <li>
              Click <strong>Auto-fill this application</strong>. The extension
              fills every field it can map, and shows you exactly which fields
              were filled and which were skipped.
            </li>
            <li>Review the filled values, fix anything you want, then submit yourself.</li>
          </ol>
          <p className="mt-3 rounded-md border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
            The extension never clicks Submit. Every action is logged to your
            application timeline so you have an audit trail of what was filled
            on which site.
          </p>
        </Card>
      </div>
    </div>
  );
}
