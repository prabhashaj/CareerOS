// JobPilot extension — background service worker
// Holds the user's Supabase access token and proxies API calls to the app.

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
    throw new Error("Not connected. Open the JobPilot app and click Connect extension.");
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
      throw new Error("Session expired. Reconnect the extension from JobPilot › Extension.");
    }
    throw new Error(`API ${res.status} at ${path}: ${snippet}`);
  }
  if (!ctype.includes("application/json")) {
    throw new Error(
      `Unexpected non-JSON response from ${base}${path}. Reconnect from JobPilot › Extension.`,
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from ${path}.`);
  }
}

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
        case "REPORT_EVENT": {
          // Best-effort; never throw to caller.
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
