/**
 * Application autofill via Browserbase + raw CDP.
 *
 * Why this shape:
 * - Cloudflare Workers (our runtime) can't run Node Playwright (native bindings).
 * - Browserbase exposes a per-page CDP WebSocket endpoint; the workerd `WebSocket`
 *   global can speak it directly without any Node-only deps.
 * - We execute the existing AutomationPlan steps through `Runtime.evaluate`, then
 *   hand the user the live-view URL so they can review and click Submit.
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { draftAutomationPlan, type AutomationPlan } from "@/lib/automation.functions";

const BB_API = "https://api.browserbase.com/v1";
const BROWSERBASE_QUOTA_MESSAGE =
  "Browser automation is out of minutes on the free plan. Open the application page directly, or upgrade your Browserbase account at https://browserbase.com/plans to continue auto-filling applications.";

type BbSession = { id: string; connectUrl: string };
type BbDebug = {
  debuggerFullscreenUrl?: string;
  debuggerUrl?: string;
  wsUrl?: string;
  pages?: Array<{ id: string; debuggerUrl: string; debuggerFullscreenUrl?: string; url: string }>;
};

type PlanStep = AutomationPlan["steps"][number];

function isBrowserbaseQuotaError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("Browser automation is out of minutes") || message.includes("Browserbase /sessions failed (402)");
}

async function bbFetchRaw(path: string, init?: RequestInit): Promise<Response> {
  const key = process.env.BROWSERBASE_API_KEY;
  if (!key) throw new Error("BROWSERBASE_API_KEY is not configured");
  const isFormData = typeof FormData !== "undefined" && init?.body instanceof FormData;
  return fetch(`${BB_API}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      "X-BB-API-Key": key,
      ...(init?.headers ?? {}),
    },
  });
}

async function bbFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await bbFetchRaw(path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Browserbase ${path} failed (${res.status}): ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

function debuggerUrlToWs(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("ws://") || url.startsWith("wss://")) return url;
  try {
    const parsed = new URL(url);
    const raw = parsed.searchParams.get("wss") ?? parsed.searchParams.get("ws");
    if (!raw) return undefined;
    return raw.startsWith("ws://") || raw.startsWith("wss://") ? raw : `wss://${raw}`;
  } catch {
    return undefined;
  }
}

function safeUploadName(name: string | null | undefined, fallback = "resume.pdf") {
  const cleaned = (name ?? fallback).split("/").pop()?.replace(/[^a-zA-Z0-9._-]/g, "_") ?? fallback;
  return cleaned.includes(".") ? cleaned : `${cleaned}.pdf`;
}

function escapePdfText(text: string) {
  return text.replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "?").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function textToPdfBlob(title: string, body: string): Blob {
  const rawLines = `${title}\n\n${body}`.replace(/\r\n/g, "\n").split("\n");
  const wrapped = rawLines.flatMap((line) => {
    if (!line.trim()) return [""];
    const chunks: string[] = [];
    for (let i = 0; i < line.length; i += 92) chunks.push(line.slice(i, i + 92));
    return chunks;
  }).slice(0, 140);
  const pages: string[][] = [];
  for (let i = 0; i < wrapped.length; i += 46) pages.push(wrapped.slice(i, i + 46));
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    `<< /Type /Pages /Kids ${pages.map((_, i) => `${3 + i * 2} 0 R`).join(" ")} /Count ${pages.length || 1} >>`,
  ];
  (pages.length ? pages : [[""]]).forEach((lines, i) => {
    const pageObj = 3 + i * 2;
    const contentObj = pageObj + 1;
    const stream = `BT /F1 10 Tf 54 744 Td 14 TL ${lines.map((l) => `(${escapePdfText(l)}) Tj T*`).join(" ")} ET`;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >> /Contents ${contentObj} 0 R >>`);
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((o) => { pdf += `${String(o).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer << /Root 1 0 R /Size ${objects.length + 1} >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

/** Ask Browserbase to release a session (frees a concurrency slot). */
async function releaseSession(id: string): Promise<void> {
  try {
    await bbFetchRaw(`/sessions/${id}`, {
      method: "POST",
      body: JSON.stringify({
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        status: "REQUEST_RELEASE",
      }),
    });
  } catch { /* ignore */ }
}

/** Create a session; if at concurrency cap, release running sessions and retry once. */
async function createSessionWithRetry(): Promise<BbSession> {
  const body = JSON.stringify({
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    keepAlive: true,
    browserSettings: { viewport: { width: 1366, height: 900 } },
  });
  const first = await bbFetchRaw("/sessions", { method: "POST", body });
  if (first.ok) return (await first.json()) as BbSession;
  if (first.status === 402) {
    throw new Error(BROWSERBASE_QUOTA_MESSAGE);
  }
  if (first.status !== 429) {
    const text = await first.text().catch(() => "");
    throw new Error(`Browserbase /sessions failed (${first.status}): ${text.slice(0, 300)}`);
  }
  // 429 — free up slots and retry once.
  try {
    const running = await bbFetch<{ id: string }[]>(
      `/sessions?status=RUNNING&projectId=${process.env.BROWSERBASE_PROJECT_ID}`,
    );
    await Promise.all((running ?? []).map((s) => releaseSession(s.id)));
    await new Promise((r) => setTimeout(r, 1500));
  } catch { /* ignore */ }
  const second = await bbFetchRaw("/sessions", { method: "POST", body });
  if (!second.ok) {
    if (second.status === 402) {
      throw new Error(BROWSERBASE_QUOTA_MESSAGE);
    }
    const text = await second.text().catch(() => "");
    throw new Error(
      `Browserbase /sessions failed (${second.status}) after freeing slots: ${text.slice(0, 300)}`,
    );
  }
  return (await second.json()) as BbSession;
}

/** Minimal CDP client over the workerd WebSocket global. */
class CdpClient {
  private ws: WebSocket;
  private nextId = 1;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private listeners = new Map<string, Array<(p: unknown) => void>>();
  private ready: Promise<void>;

  constructor(url: string) {
    this.ws = new WebSocket(url);
    this.ready = new Promise((resolve, reject) => {
      this.ws.addEventListener("open", () => resolve());
      this.ws.addEventListener("error", () => reject(new Error("CDP socket error")));
    });
    this.ws.addEventListener("message", (ev: MessageEvent) => {
      try {
        const msg = JSON.parse(typeof ev.data === "string" ? ev.data : "");
        if (typeof msg.id === "number" && this.pending.has(msg.id)) {
          const p = this.pending.get(msg.id)!;
          this.pending.delete(msg.id);
          if (msg.error) p.reject(new Error(msg.error.message ?? "CDP error"));
          else p.resolve(msg.result);
        } else if (typeof msg.method === "string") {
          const ls = this.listeners.get(msg.method);
          if (ls) ls.forEach((fn) => { try { fn(msg.params); } catch { /* ignore */ } });
        }
      } catch {
        /* ignore */
      }
    });
  }

  on(method: string, fn: (params: unknown) => void) {
    const arr = this.listeners.get(method) ?? [];
    arr.push(fn);
    this.listeners.set(method, arr);
  }

  waitFor(method: string, timeoutMs = 20_000): Promise<void> {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => { if (!done) { done = true; resolve(); } };
      this.on(method, finish);
      setTimeout(finish, timeoutMs);
    });
  }

  async send<T = unknown>(method: string, params: Record<string, unknown> = {}, sessionId?: string): Promise<T> {
    await this.ready;
    const id = this.nextId++;
    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (v: unknown) => void, reject });
      this.ws.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
      setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`CDP timeout: ${method}`));
        }
      }, 30_000);
    });
  }

  close() {
    try { this.ws.close(); } catch { /* ignore */ }
  }
}

async function attachToFirstPage(cdp: CdpClient): Promise<string> {
  const targets = await cdp.send<{ targetInfos: Array<{ targetId: string; type: string; url: string }> }>(
    "Target.getTargets",
  );
  let target = targets.targetInfos.find((t) => t.type === "page");
  if (!target) {
    const created = await cdp.send<{ targetId: string }>("Target.createTarget", { url: "about:blank" });
    target = { targetId: created.targetId, type: "page", url: "about:blank" };
  }
  const attached = await cdp.send<{ sessionId: string }>("Target.attachToTarget", {
    targetId: target.targetId,
    flatten: true,
  });
  return attached.sessionId;
}

async function attachToFirstPageIfNeeded(cdp: CdpClient): Promise<string | undefined> {
  try {
    return await attachToFirstPage(cdp);
  } catch {
    return undefined;
  }
}

async function uploadSessionFile(sessionId: string, file: Blob, fileName: string): Promise<string> {
  const form = new FormData();
  form.append("file", file, fileName);
  const res = await bbFetchRaw(`/sessions/${sessionId}/uploads`, { method: "POST", body: form });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Browserbase upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
  return `/tmp/.uploads/${fileName}`;
}

async function setFileInput(
  cdp: CdpClient,
  pageSessionId: string,
  selector: string,
  remotePath: string,
): Promise<boolean> {
  const doc = await cdp.send<{ root: { nodeId: number } }>("DOM.getDocument", { depth: -1 }, pageSessionId);
  const input = await cdp.send<{ nodeId: number }>(
    "DOM.querySelector",
    { nodeId: doc.root.nodeId, selector },
    pageSessionId,
  );
  if (!input.nodeId) return false;
  await cdp.send("DOM.setFileInputFiles", { nodeId: input.nodeId, files: [remotePath] }, pageSessionId);
  await cdp.send(
    "Runtime.evaluate",
    {
      expression: `(() => { const el = document.querySelector(${JSON.stringify(selector)}); if (el) { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } })()`,
      awaitPromise: true,
    },
    pageSessionId,
  );
  return true;
}

/** Browser-side script: executes the plan steps against the loaded page. */
function buildExecutorScript(plan: AutomationPlan, uploadedSelectors: string[] = []): string {
  const safePlan = JSON.stringify(plan.steps);
  const safeUploads = JSON.stringify(uploadedSelectors);
  return `
(async () => {
  const steps = ${safePlan};
  const uploadedSelectors = new Set(${safeUploads});
  const results = [];
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const find = (sel) => {
    try {
      // Allow text=Label syntax → find by visible text on inputs/buttons.
      if (sel.startsWith("text=")) {
        const t = sel.slice(5).trim().toLowerCase();
        const all = Array.from(document.querySelectorAll("button, a, label, input, textarea, select"));
        return all.find((el) => (el.textContent || el.value || "").trim().toLowerCase().includes(t)) || null;
      }
      return document.querySelector(sel);
    } catch { return null; }
  };
  for (const s of steps) {
    try {
      // Skip optional fields with no value — leave non-mandatory fields blank.
      const isOptional = s.required !== true;
      const hasValue = s.value != null && String(s.value).trim() !== "";
      if (isOptional && (s.action === "fill" || s.action === "select") && !hasValue) {
        results.push({ step: s, ok: true, skipped: "optional_no_value" });
        continue;
      }
      const el = find(s.selector);
      if (!el) { results.push({ step: s, ok: false, reason: "not_found" }); continue; }
      el.scrollIntoView({ block: "center", behavior: "instant" });
      if (s.action === "fill" && s.value != null) {
        el.focus();
        const setter = Object.getOwnPropertyDescriptor(el.__proto__, "value")?.set;
        if (setter) setter.call(el, s.value); else el.value = s.value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        results.push({ step: s, ok: true });
      } else if (s.action === "select" && s.value != null) {
        el.value = s.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        results.push({ step: s, ok: true });
      } else if (s.action === "check") {
        if (!el.checked) el.click();
        results.push({ step: s, ok: true });
      } else if (s.action === "click") {
        // Don't auto-click final submit buttons — user reviews & submits.
        const label = ((s.field_label || "") + " " + (s.note || "") + " " + (el.textContent || el.value || "")).toLowerCase();
        if (/submit|apply now|send application/.test(label)) {
          results.push({ step: s, ok: false, skipped: "submit_left_for_user" });
        } else {
          el.click();
          results.push({ step: s, ok: true });
        }
      } else if (s.action === "wait") {
        await sleep(Math.min(parseInt(s.value || "500", 10) || 500, 5000));
        results.push({ step: s, ok: true });
      } else if (s.action === "upload") {
        if (uploadedSelectors.has(s.selector)) {
          results.push({ step: s, ok: true, uploaded: true });
        } else {
          // Highlight file input so user knows what to upload manually.
          try { el.style.outline = "3px solid #f59e0b"; el.scrollIntoView({ block: "center" }); } catch {}
          results.push({ step: s, ok: false, skipped: "upload_requires_user" });
        }
      } else {
        results.push({ step: s, ok: false, reason: "unknown_action" });
      }
      await sleep(80);
    } catch (e) {
      results.push({ step: s, ok: false, reason: String(e && e.message || e) });
    }
  }
  return JSON.stringify(results);
})()
`.trim();
}

export const runAutoFill = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ application_id: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;

    // 1) Load application + job.
    const { data: app, error: appErr } = await supabase
      .from("job_applications")
      .select("id, job_id, tailored_resume, tailored_resume_doc_id")
      .eq("id", data.application_id)
      .maybeSingle();
    if (appErr || !app) throw new Error("Application not found");

    const { data: job } = await supabase
      .from("jobs")
      .select("id, source_url, title, company")
      .eq("id", app.job_id)
      .maybeSingle();
    if (!job?.source_url) throw new Error("This job has no application URL to autofill");

    // 2) Get a fresh plan (re-uses existing AI planner, which scrapes the form).
    const { plan } = await draftAutomationPlan({ data: { application_id: app.id } });
    if (!plan.steps.length) {
      return {
        sessionId: null,
        liveViewUrl: null,
        directApplyUrl: job.source_url,
        plan,
        filled: 0,
        total: 0,
        uploaded: 0,
        manualUploads: 0,
        error: "No fillable fields detected on the page.",
      };
    }

    // 3) Create Browserbase session (auto-releases stuck sessions on 429).
    let session: BbSession;
    try {
      session = await createSessionWithRetry();
    } catch (e) {
      if (!isBrowserbaseQuotaError(e)) throw e;
      await supabase.from("application_events").insert({
        user_id: context.userId,
        application_id: app.id,
        job_id: job.id,
        event_type: "autofill_run",
        payload: { filled: 0, total: plan.steps.length, sessionId: null, error: BROWSERBASE_QUOTA_MESSAGE, uploaded: 0, manualUploads: 0, draftUrl: null },
      });
      return {
        sessionId: null,
        liveViewUrl: null,
        directApplyUrl: job.source_url,
        draftUrl: null,
        plan,
        filled: 0,
        total: plan.steps.length,
        uploaded: 0,
        manualUploads: 0,
        error: BROWSERBASE_QUOTA_MESSAGE,
      };
    }

    // 4) Get an initial live-view URL. We refetch after navigation so the link points at the real job page.
    let debug: BbDebug = await bbFetch<BbDebug>(`/sessions/${session.id}/debug`);
    let liveViewUrl = debug.pages?.[0]?.debuggerFullscreenUrl ?? debug.debuggerFullscreenUrl ?? debug.debuggerUrl ?? null;

    // 5) Drive CDP: navigate → wait for load → run executor script.
    const cdp = new CdpClient(debuggerUrlToWs(session.connectUrl) ?? session.connectUrl);
    let filled = 0;
    let runError: string | null = null;
    let uploaded = 0;
    let manualUploads = 0;
    const uploadedSelectors: string[] = [];
    try {
      const pageSessionId = await attachToFirstPage(cdp);
      await cdp.send("Page.enable", {}, pageSessionId);
      await cdp.send("Runtime.enable", {}, pageSessionId);
      await cdp.send("DOM.enable", {}, pageSessionId);
      const loaded = cdp.waitFor("Page.loadEventFired", 25_000);
      await cdp.send("Page.navigate", { url: job.source_url }, pageSessionId);
      await loaded;
      // Small extra wait for client-side rendered ATS forms (Lever/Greenhouse/Workday hydrate after load).
      await new Promise((r) => setTimeout(r, 2500));

      for (const step of plan.steps.filter((s: PlanStep) => s.action === "upload")) {
        try {
          let remotePath: string | null = null;
          if (app.tailored_resume_doc_id) {
            const { data: doc } = await supabase
              .from("documents")
              .select("title, storage_path, extracted_text")
              .eq("id", app.tailored_resume_doc_id)
              .maybeSingle();
            if (doc?.storage_path) {
              const { data: sig } = await supabase.storage.from("jobpilot-documents").createSignedUrl(doc.storage_path, 60 * 5);
              if (sig?.signedUrl) {
                const fileRes = await fetch(sig.signedUrl);
                if (fileRes.ok) {
                  remotePath = await uploadSessionFile(session.id, await fileRes.blob(), safeUploadName(doc.title));
                }
              }
            }
            if (!remotePath && doc?.extracted_text) {
              remotePath = await uploadSessionFile(session.id, textToPdfBlob(doc.title, doc.extracted_text), safeUploadName(doc.title));
            }
          }
          if (!remotePath && app.tailored_resume) {
            const fileName = safeUploadName(`${job.company}-${job.title}-resume.pdf`);
            remotePath = await uploadSessionFile(
              session.id,
              textToPdfBlob(`${job.title} — ${job.company}`, app.tailored_resume),
              fileName,
            );
          }
          if (!remotePath) {
            const { data: primaryResume } = await supabase
              .from("documents")
              .select("title, storage_path, extracted_text")
              .eq("kind", "resume")
              .eq("is_primary", true)
              .maybeSingle();
            if (primaryResume?.storage_path) {
              const { data: sig } = await supabase.storage.from("jobpilot-documents").createSignedUrl(primaryResume.storage_path, 60 * 5);
              if (sig?.signedUrl) {
                const fileRes = await fetch(sig.signedUrl);
                if (fileRes.ok) remotePath = await uploadSessionFile(session.id, await fileRes.blob(), safeUploadName(primaryResume.title));
              }
            }
            if (!remotePath && primaryResume?.extracted_text) {
              remotePath = await uploadSessionFile(session.id, textToPdfBlob(primaryResume.title, primaryResume.extracted_text), safeUploadName(primaryResume.title));
            }
          }
          if (remotePath && await setFileInput(cdp, pageSessionId, step.selector, remotePath)) {
            uploaded += 1;
            uploadedSelectors.push(step.selector);
          } else {
            manualUploads += 1;
          }
        } catch {
          manualUploads += 1;
        }
      }

      debug = await bbFetch<BbDebug>(`/sessions/${session.id}/debug`);
      const activePage = debug.pages?.find((p) => p.url && p.url !== "about:blank") ?? debug.pages?.[0];
      liveViewUrl = activePage?.debuggerFullscreenUrl ?? debug.debuggerFullscreenUrl ?? debug.debuggerUrl ?? liveViewUrl;

      const evalRes = await cdp.send<{ result: { value?: string; type: string }; exceptionDetails?: unknown }>(
        "Runtime.evaluate",
        {
          expression: buildExecutorScript(plan, uploadedSelectors),
          awaitPromise: true,
          returnByValue: true,
          timeout: 25_000,
        },
        pageSessionId,
      );
      if (evalRes.exceptionDetails) {
        runError = "Form fill script threw inside the page";
      } else if (evalRes.result?.value) {
        try {
          const parsed = JSON.parse(evalRes.result.value) as Array<{ ok: boolean }>;
          filled = parsed.filter((r) => r.ok).length;
        } catch { /* ignore */ }
      }
    } catch (e) {
      runError = e instanceof Error ? e.message : "Autofill failed";
    }

    // 5b) Try to save a draft on the job site so the user can resume there directly.
    let draftUrl: string | null = null;
    try {
      const pageSessionId = await attachToFirstPageIfNeeded(cdp);
      await cdp.send("Runtime.enable", {}, pageSessionId);
      const saveRes = await cdp.send<{ result: { value?: string }; exceptionDetails?: unknown }>(
        "Runtime.evaluate",
        {
          expression: `
(async () => {
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const s = window.getComputedStyle(el);
    return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
  };
  const cands = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a'));
  const btn = cands.find((el) => {
    const t = ((el.textContent || el.value || el.getAttribute('aria-label') || '') + '').trim().toLowerCase();
    return visible(el) && !el.disabled && /(save (and continue|as draft|draft|for later|progress)|save and finish later|finish later|continue later)/.test(t);
  });
  if (!btn) return JSON.stringify({ saved: false, url: location.href });
  btn.scrollIntoView({ block: 'center' });
  btn.click();
  await new Promise((r) => setTimeout(r, 3500));
  return JSON.stringify({ saved: true, url: location.href });
})()
`.trim(),
          awaitPromise: true,
          returnByValue: true,
          timeout: 12_000,
        },
        pageSessionId,
      );
      if (!saveRes.exceptionDetails && saveRes.result?.value) {
        const parsed = JSON.parse(saveRes.result.value) as { saved?: boolean; url?: string };
        if (parsed.saved && parsed.url) draftUrl = parsed.url;
      }
    } catch { /* draft save is best-effort */ }

    cdp.close();

    // 6) Log event + persist draft URL onto the application so Apply buttons can deep-link to it.
    if (draftUrl) {
      const { data: current } = await supabase
        .from("job_applications")
        .select("answers")
        .eq("id", app.id)
        .maybeSingle();
      const answers = (current?.answers ?? {}) as Record<string, unknown>;
      await supabase
        .from("job_applications")
        .update({ answers: { ...answers, draft_url: draftUrl } })
        .eq("id", app.id);
    }

    await supabase.from("application_events").insert({
      user_id: context.userId,
      application_id: app.id,
      job_id: job.id,
      event_type: "autofill_run",
      payload: { filled, total: plan.steps.length, sessionId: session.id, error: runError, uploaded, manualUploads, draftUrl },
    });

    const handoffLiveViewUrl = runError && filled === 0 && uploaded === 0 ? null : liveViewUrl;
    if (!handoffLiveViewUrl) await releaseSession(session.id);

    return {
      sessionId: session.id,
      liveViewUrl: handoffLiveViewUrl,
      directApplyUrl: draftUrl ?? job.source_url,
      draftUrl,
      plan,
      filled,
      total: plan.steps.length,
      uploaded,
      manualUploads,
      error: runError,
    };
  });


export const submitAutofilledApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      application_id: z.string().uuid(),
      session_id: z.string().min(1).max(200),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: app, error: appErr } = await supabase
      .from("job_applications")
      .select("id, job_id")
      .eq("id", data.application_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (appErr || !app) throw new Error("Application not found");

    const debug = await bbFetch<BbDebug>(`/sessions/${data.session_id}/debug`);
    const activePage = debug.pages?.find((p) => p.url && p.url !== "about:blank") ?? debug.pages?.[0];
    const wsUrl = debug.wsUrl ?? debuggerUrlToWs(activePage?.debuggerUrl) ?? debuggerUrlToWs(debug.debuggerUrl);
    if (!wsUrl) throw new Error("Live browser session is not available anymore. Please start fresh.");

    const cdp = new CdpClient(wsUrl);
    try {
      const pageSessionId = await attachToFirstPageIfNeeded(cdp);
      await cdp.send("Runtime.enable", {}, pageSessionId);
      const evalRes = await cdp.send<{ result: { value?: string }; exceptionDetails?: unknown }>(
        "Runtime.evaluate",
        {
          expression: `
(() => {
  const visible = (el) => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
  };
  const candidates = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a'));
  const button = candidates.find((el) => {
    const text = ((el.textContent || el.value || el.getAttribute('aria-label') || '') + '').trim().toLowerCase();
    return visible(el) && !el.disabled && /submit application|submit|apply now|send application/.test(text);
  });
  if (!button) return JSON.stringify({ clicked: false, message: 'Could not find a visible submit button.' });
  button.scrollIntoView({ block: 'center' });
  button.click();
  return JSON.stringify({ clicked: true, url: location.href });
})()
`.trim(),
          awaitPromise: true,
          returnByValue: true,
          timeout: 10_000,
        },
        pageSessionId,
      );
      if (evalRes.exceptionDetails) throw new Error("Submit click failed inside the live browser.");
      const clickResult = JSON.parse(evalRes.result?.value || "{}") as { clicked?: boolean; message?: string; url?: string };
      if (!clickResult.clicked) throw new Error(clickResult.message ?? "Could not find the submit button.");

      await new Promise((r) => setTimeout(r, 4000));
      const statusRes = await cdp.send<{ result: { value?: string } }>(
        "Runtime.evaluate",
        {
          expression: `
(() => {
  const text = document.body?.innerText?.slice(0, 12000) || '';
  const lower = text.toLowerCase();
  const submitted = /thank you|thanks for applying|application submitted|application received|successfully submitted|we received your application/.test(lower);
  const blocked = /required|please complete|please fill|invalid|required field/.test(lower) && /submit application|submit/.test(lower);
  return JSON.stringify({ submitted, blocked, url: location.href, title: document.title, text: text.slice(0, 800) });
})()
`.trim(),
          returnByValue: true,
          timeout: 10_000,
        },
        pageSessionId,
      );
      const status = JSON.parse(statusRes.result?.value || "{}") as { submitted?: boolean; blocked?: boolean; url?: string; text?: string };
      if (status.blocked && !status.submitted) {
        return { ok: false, submitted: false, message: "The job site still shows required fields. Complete the highlighted fields in the live browser, then submit again.", url: status.url };
      }

      const now = new Date().toISOString();
      await supabase
        .from("job_applications")
        .update({ status: "submitted", submitted_at: now })
        .eq("id", app.id)
        .eq("user_id", userId);
      await supabase.from("application_events").insert({
        user_id: userId,
        application_id: app.id,
        job_id: app.job_id,
        event_type: "application_submitted_from_live_browser",
        payload: { sessionId: data.session_id, url: status.url ?? clickResult.url, confirmed: status.submitted === true },
      });

      return {
        ok: true,
        submitted: true,
        message: status.submitted ? "Application submitted." : "Submit was clicked and the application was marked submitted. Please check the live browser for any final confirmation.",
        url: status.url ?? clickResult.url,
      };
    } finally {
      cdp.close();
    }
  });
