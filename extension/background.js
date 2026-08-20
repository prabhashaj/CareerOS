// CareerOS extension — background service worker
// 1. Manages Supabase session & communicates with CareerOS API.
// 2. Implements direct Chrome DevTools Protocol (CDP) execution engine via chrome.debugger.

const DEFAULT_APP_URL = "http://localhost:8080";
const DEFAULT_API_URL = "http://localhost:8080";

function getApiBaseUrl(auth, appUrl) {
  const candidates = [auth?.api_url, auth?.app_url, appUrl, DEFAULT_APP_URL];
  for (const c of candidates) {
    if (!c) continue;
    try {
      const u = new URL(c);
      return `${u.protocol}//${u.host}`;
    } catch (_e) {
      // skip invalid
    }
  }
  return DEFAULT_API_URL;
}

async function getConfig() {
  const { auth, appUrl } = await chrome.storage.local.get(["auth", "appUrl"]);
  return { auth, appUrl: appUrl || DEFAULT_APP_URL };
}

async function setAuth(payload) {
  await chrome.storage.local.set({
    auth: {
      access_token: payload.access_token,
      refresh_token: payload.refresh_token || null,
      user: payload.user || null,
      app_url: payload.app_url || null,
      api_url: payload.api_url || DEFAULT_API_URL,
      saved_at: Date.now(),
    },
    appUrl: payload.app_url || undefined,
  });
}

async function clearAuth() {
  await chrome.storage.local.remove(["auth"]);
}

async function callApi(path, body) {
  const { auth, appUrl } = await getConfig();
  if (!auth?.access_token) {
    throw new Error("Not connected. Open CareerOS and connect the extension.");
  }
  const base = getApiBaseUrl(auth, appUrl);
  let res;
  try {
    res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.access_token}`,
      },
      body: JSON.stringify(body || {}),
    });
  } catch (e) {
    throw new Error(`Network error reaching ${base}: ${e?.message || e}`);
  }
  const ctype = res.headers.get("content-type") || "";
  const text = await res.text();
  if (!res.ok) {
    const snippet = text.slice(0, 160).replace(/\s+/g, " ");
    if (res.status === 401) {
      throw new Error("Session expired. Reconnect the extension from CareerOS.");
    }
    throw new Error(`API ${res.status} at ${path}: ${snippet}`);
  }
  if (!ctype.includes("application/json")) {
    throw new Error(`Unexpected non-JSON response from ${base}${path}.`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${path}.`);
  }
}

// ============================================================================
// CDP (Chrome DevTools Protocol) Engine
// ============================================================================

function attachCDP(tabId) {
  return new Promise((resolve, reject) => {
    chrome.debugger.attach({ tabId }, "1.3", () => {
      const err = chrome.runtime.lastError;
      if (err) {
        if (err.message && err.message.includes("already attached")) {
          resolve();
        } else {
          reject(new Error(err.message));
        }
      } else {
        resolve();
      }
    });
  });
}

function sendCDP(tabId, method, params = {}) {
  return new Promise((resolve, reject) => {
    chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
      const err = chrome.runtime.lastError;
      if (err) {
        reject(new Error(err.message));
      } else {
        resolve(result);
      }
    });
  });
}

function detachCDP(tabId) {
  return new Promise((resolve) => {
    chrome.debugger.detach({ tabId }, () => {
      resolve();
    });
  });
}

/**
 * Execute native CDP Autofill on target tab.
 */
async function executeCDPAutofill(tabId, plan) {
  const logs = [];
  const log = (msg) => {
    logs.push({ time: new Date().toLocaleTimeString(), text: msg });
    chrome.runtime.sendMessage({ type: "CDP_LOG", tabId, log: msg }).catch(() => {});
  };

  try {
    log("Attaching Chrome DevTools Protocol to tab " + tabId + "...");
    await attachCDP(tabId);

    log("Enabling CDP domains (DOM, Page, Runtime, Input)...");
    await sendCDP(tabId, "DOM.enable");
    await sendCDP(tabId, "Page.enable");
    await sendCDP(tabId, "Runtime.enable");

    // 1. Scan and detect ATS / form structure via Runtime
    log("Inspecting page DOM structure via CDP...");
    const scanResult = await sendCDP(tabId, "Runtime.evaluate", {
      expression: `(() => {
        const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
        return inputs.map((el, i) => ({
          idx: i,
          tag: el.tagName.toLowerCase(),
          type: el.type || null,
          name: el.name || null,
          id: el.id || null,
          placeholder: el.placeholder || null,
          value: el.value || ''
        }));
      })()`,
      returnByValue: true,
    });

    const fields = scanResult?.result?.value || [];
    log(`Found ${fields.length} interactive form fields.`);

    // 2. Dispatch CDP-based input actions
    const candidate = plan.candidate || {};
    const answers = plan.answers || {};

    const MAPPERS = [
      { key: "first_name", val: candidate.first_name, test: /first[\s_-]*name|given/i },
      { key: "last_name", val: candidate.last_name, test: /last[\s_-]*name|surname/i },
      { key: "full_name", val: candidate.full_name, test: /full[\s_-]*name|your name|legal/i },
      { key: "email", val: candidate.email, test: /e[\s_-]*mail/i },
      { key: "phone", val: candidate.phone, test: /phone|mobile|cell/i },
      { key: "location", val: candidate.location, test: /city|location|address/i },
      { key: "linkedin_url", val: candidate.linkedin_url, test: /linkedin/i },
      { key: "portfolio_url", val: candidate.portfolio_url, test: /portfolio|website|github/i },
      { key: "salary", val: candidate.salary_expectations, test: /salary|compensation/i },
      { key: "work_auth", val: candidate.work_authorization, test: /authoriz|work permit/i },
    ];

    let filledCount = 0;

    for (const f of fields) {
      const descriptor = `${f.id || ""} ${f.name || ""} ${f.placeholder || ""}`;
      let matchedVal = null;
      let matchedKey = null;

      for (const m of MAPPERS) {
        if (m.test.test(descriptor) && m.val) {
          matchedVal = m.val;
          matchedKey = m.key;
          break;
        }
      }

      if (!matchedVal && answers[descriptor.trim()]) {
        matchedVal = answers[descriptor.trim()];
        matchedKey = descriptor;
      }

      if (matchedVal) {
        log(`Filling field [${f.name || f.id || f.type}] (${matchedKey}) via CDP...`);
        // Native synthetic value set + dispatch input event
        await sendCDP(tabId, "Runtime.evaluate", {
          expression: `(() => {
            const el = document.getElementById("${f.id || ""}") || document.querySelector('[name="${f.name || ""}"]');
            if (!el) return false;
            el.focus();
            const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
            const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
            if (setter) setter.call(el, ${JSON.stringify(matchedVal)});
            else el.value = ${JSON.stringify(matchedVal)};
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
            el.dispatchEvent(new Event('blur', { bubbles: true }));
            return true;
          })()`,
        });

        filledCount++;
        await new Promise((r) => setTimeout(r, 80));
      }
    }

    log(`Successfully filled ${filledCount} fields with native CDP events.`);
    log("Ready for candidate review! (Automation complete)");

    return { ok: true, filledCount, logs };
  } catch (err) {
    log(`CDP execution error: ${err.message}`);
    throw err;
  } finally {
    try {
      await detachCDP(tabId);
    } catch {
      // ignore
    }
  }
}

// ============================================================================
// Message Listener
// ============================================================================

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  (async () => {
    try {
      switch (msg?.type) {
        case "JOBPILOT_AUTH_PAYLOAD": {
          await setAuth(msg.payload);
          sendResponse({ ok: true });
          break;
        }
        case "GET_STATUS": {
          const { auth, appUrl } = await getConfig();
          sendResponse({ ok: true, connected: !!auth?.access_token, user: auth?.user || null, appUrl });
          break;
        }
        case "DISCONNECT": {
          await clearAuth();
          sendResponse({ ok: true });
          break;
        }
        case "FETCH_CONTEXT": {
          const data = await callApi("/api/public/extension/context", { job_url: msg.url, page_title: msg.title });
          sendResponse({ ok: true, data });
          break;
        }
        case "FETCH_AGENT_PLAN": {
          const data = await callApi("/api/public/extension/agent-plan", {
            job_url: msg.url,
            job_id: msg.jobId,
            application_id: msg.applicationId,
            page_title: msg.title,
          });
          sendResponse({ ok: true, data: data.plan });
          break;
        }
        case "RUN_CDP_AUTOFILL": {
          const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (!activeTab?.id) throw new Error("No active tab found");
          
          let plan = msg.plan;
          if (!plan) {
            const planRes = await callApi("/api/public/extension/agent-plan", {
              job_url: activeTab.url,
              page_title: activeTab.title,
            });
            plan = planRes.plan;
          }

          const res = await executeCDPAutofill(activeTab.id, plan);
          sendResponse({ ok: true, result: res });
          break;
        }
        case "IMPORT_JOB": {
          const res = await callApi("/api/public/extension/import-job", msg.job);
          sendResponse({ ok: true, data: res });
          break;
        }
        case "REPORT_EVENT": {
          callApi("/api/public/extension/event", { event_type: msg.eventType, payload: msg.payload }).catch(() => {});
          sendResponse({ ok: true });
          break;
        }
        default:
          sendResponse({ ok: false, error: "unknown message" });
      }
    } catch (e) {
      sendResponse({ ok: false, error: e?.message || String(e) });
    }
  })();
  return true; // async
});
