const $ = (id) => document.getElementById(id);

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
  const ping = await sendTab(tab.id, { type: "PING_PAGE" });
  $("ats-line").textContent = ping?.ok ? `Detected ATS: ${ping.ats}` : "(page not ready)";
}

$("open-app")?.addEventListener("click", async () => {
  const s = await sendBg({ type: "GET_STATUS" });
  chrome.tabs.create({ url: `${s.appUrl}/extension` });
});

$("disconnect")?.addEventListener("click", async () => {
  await sendBg({ type: "DISCONNECT" });
  refreshStatus();
});

$("scan")?.addEventListener("click", async () => {
  setStatus("Scanning fields…");
  const tab = await getActiveTab();
  const res = await sendTab(tab.id, { type: "SCAN_FIELDS" });
  if (!res?.ok) return setStatus(res?.error || "Scan failed", "error");
  setStatus(`Found ${res.fields.length} fields · ${res.mapped.filter((m) => m.key).length} mappable`, "success");
  res.mapped.forEach((m) => log(`${m.key ? "✓" : "·"} ${m.label || "(no label)"}${m.key ? " → " + m.key : ""}`));
});

$("autofill")?.addEventListener("click", async () => {
  setStatus("Fetching your profile + KB answers…");
  const tab = await getActiveTab();
  const ping = await sendTab(tab.id, { type: "PING_PAGE" });
  if (!ping?.ok) return setStatus("Open a job application page first.", "error");

  const ctxRes = await sendBg({ type: "FETCH_CONTEXT", url: ping.url, title: ping.title });
  if (!ctxRes?.ok) return setStatus(ctxRes?.error || "Could not load context", "error");

  setStatus("Filling fields…");
  const fill = await sendTab(tab.id, { type: "AUTOFILL", context: ctxRes.data });
  if (!fill?.ok) return setStatus(fill?.error || "Autofill failed", "error");

  setStatus(`Filled ${fill.filled} of ${fill.total} fields (${fill.skipped} skipped). Review before submitting.`, "success");
  fill.events.forEach((e) => log(`${e.status === "filled" ? "✓" : "·"} ${e.label || e.key} — ${e.status}`));

  sendBg({
    type: "REPORT_EVENT",
    eventType: "extension_autofill",
    payload: { url: ping.url, ats: ping.ats, ...fill, events: undefined, sample: fill.events.slice(0, 20) },
  });
});

refreshStatus();
