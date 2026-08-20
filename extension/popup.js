const $ = (id) => document.getElementById(id);

let currentJobDetails = null;

async function sendBg(msg) {
  return new Promise((resolve) => chrome.runtime.sendMessage(msg, (r) => resolve(r)));
}

async function sendTab(tabId, msg) {
  return new Promise((resolve) =>
    chrome.tabs.sendMessage(tabId, msg, (r) => resolve(r || { ok: false, error: chrome.runtime.lastError?.message })),
  );
}

function log(line, cls = "") {
  const li = document.createElement("li");
  li.textContent = line;
  if (cls) li.className = cls;
  $("log").prepend(li);
}

function setStatus(text, kind = "") {
  const el = $("status");
  el.hidden = !text;
  el.textContent = text;
  el.className = "status " + kind;
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function refreshStatus() {
  const s = await sendBg({ type: "GET_STATUS" });
  if (!s?.connected) {
    $("not-connected").hidden = false;
    $("connected").hidden = true;
    $("disconnect").hidden = true;
    $("connection").textContent = "not connected";
    return;
  }
  $("not-connected").hidden = true;
  $("connected").hidden = false;
  $("disconnect").hidden = false;
  $("connection").textContent = s.user?.email ? `connected · ${s.user.email}` : "connected";

  const tab = await getActiveTab();
  $("page-url").textContent = tab?.url || "";

  // Extract job details from page
  if (tab?.id) {
    const ext = await sendTab(tab.id, { type: "EXTRACT_JOB_DETAILS" });
    if (ext?.ok && ext.details) {
      currentJobDetails = ext.details;
      $("job-title-line").textContent = `${ext.details.title} @ ${ext.details.company}`;
      $("ats-badge").textContent = ext.details.ats || "Job Page";
    } else {
      $("job-title-line").textContent = tab.title || "Unknown Page";
      $("ats-badge").textContent = "Web";
    }
  }
}

// Real-time CDP log listener
chrome.runtime.onMessage.addListener((msg) => {
  if (msg?.type === "CDP_LOG") {
    log(`[CDP] ${msg.log}`);
  }
});

$("open-app")?.addEventListener("click", async () => {
  const s = await sendBg({ type: "GET_STATUS" });
  chrome.tabs.create({ url: `${s.appUrl}/jobs` });
});

$("disconnect")?.addEventListener("click", async () => {
  await sendBg({ type: "DISCONNECT" });
  refreshStatus();
});

// 1. Capture & Import Job to CareerOS
$("import-job")?.addEventListener("click", async () => {
  setStatus("Extracting job details from active page…");
  const tab = await getActiveTab();
  if (!tab?.url || tab.url.startsWith("chrome://")) {
    return setStatus("Open a job posting page first.", "error");
  }

  let details = currentJobDetails;
  if (!details) {
    const ext = await sendTab(tab.id, { type: "EXTRACT_JOB_DETAILS" });
    if (!ext?.ok || !ext.details) {
      return setStatus("Could not extract job information from page.", "error");
    }
    details = ext.details;
  }

  setStatus(`Importing "${details.title}" to CareerOS…`);
  const importRes = await sendBg({
    type: "IMPORT_JOB",
    job: details,
  });

  if (!importRes?.ok || !importRes.data) {
    return setStatus(importRes?.error || "Import failed. Check connection to CareerOS.", "error");
  }

  const jobData = importRes.data;
  log(`[Imported] ${details.title} at ${details.company} (ID: ${jobData.job_id})`);
  setStatus(
    jobData.already_exists
      ? `Job already in your pipeline! Saved as application.`
      : `✓ Job imported into CareerOS! Auto-ranked in pipeline.`,
    "success",
  );
});

// 2. Full Native CDP Autofill
$("cdp-autofill")?.addEventListener("click", async () => {
  setStatus("Initializing Chrome DevTools Protocol Agent…");
  const tab = await getActiveTab();
  if (!tab?.url || tab.url.startsWith("chrome://")) {
    return setStatus("Open a job application page first.", "error");
  }

  log("Requesting AI execution plan from CareerOS...");
  const planRes = await sendBg({
    type: "FETCH_AGENT_PLAN",
    url: tab.url,
    title: tab.title,
  });

  if (!planRes?.ok || !planRes.data) {
    return setStatus(planRes?.error || "Could not generate CDP plan.", "error");
  }

  setStatus("Executing native CDP actions on tab…");
  const runRes = await sendBg({
    type: "RUN_CDP_AUTOFILL",
    plan: planRes.data,
  });

  if (!runRes?.ok) {
    return setStatus(runRes?.error || "CDP execution failed", "error");
  }

  const filled = runRes.result?.filledCount || 0;
  setStatus(`⚡ CDP Agent completed! Filled ${filled} fields. Review & click Submit.`, "success");
});

// 3. Fast DOM Fallback
$("autofill")?.addEventListener("click", async () => {
  setStatus("Fetching profile + KB answers…");
  const tab = await getActiveTab();
  const ping = await sendTab(tab.id, { type: "PING_PAGE" });
  if (!ping?.ok) return setStatus("Open a job application page first.", "error");

  const ctxRes = await sendBg({ type: "FETCH_CONTEXT", url: ping.url, title: ping.title });
  if (!ctxRes?.ok) return setStatus(ctxRes?.error || "Could not load context", "error");

  setStatus("Filling fields…");
  const fill = await sendTab(tab.id, { type: "AUTOFILL", context: ctxRes.data });
  if (!fill?.ok) return setStatus(fill?.error || "Autofill failed", "error");

  setStatus(`Filled ${fill.filled} of ${fill.total} fields (${fill.skipped} skipped).`, "success");
  fill.events.forEach((e) => log(`${e.status === "filled" ? "✓" : "·"} ${e.label || e.key} — ${e.status}`));
});

$("scan")?.addEventListener("click", async () => {
  setStatus("Scanning fields via DOM & CDP…");
  const tab = await getActiveTab();
  const res = await sendTab(tab.id, { type: "SCAN_FIELDS" });
  if (!res?.ok) return setStatus(res?.error || "Scan failed", "error");
  setStatus(`Found ${res.fields.length} fields · ${res.mapped.filter((m) => m.key).length} auto-fillable`, "success");
  res.mapped.forEach((m) => log(`${m.key ? "✓" : "·"} ${m.label || "(no label)"}${m.key ? " → " + m.key : ""}`));
});

refreshStatus();
