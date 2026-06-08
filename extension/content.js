// JobPilot content script — runs on every page.
// Responsibilities:
//   1. On the JobPilot connect page: receive Supabase tokens via window.postMessage
//      and forward them to the background service worker.
//   2. On job application pages: when asked by the popup, detect form fields,
//      map them to candidate data returned by the server, and fill them.
//
// All writes to the page are transparent and logged — nothing is auto-submitted.

(function () {
  // ---------- 1. Auth bridge ----------
  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const msg = event.data;
    if (!msg || msg.type !== "JOBPILOT_AUTH" || !msg.payload?.access_token) return;
    try {
      chrome.runtime.sendMessage(
        { type: "JOBPILOT_AUTH_PAYLOAD", payload: msg.payload },
        (resp) => {
          window.postMessage(
            { type: "JOBPILOT_AUTH_ACK", ok: !!resp?.ok, error: resp?.error || null },
            window.location.origin,
          );
        },
      );
    } catch (e) {
      window.postMessage(
        { type: "JOBPILOT_AUTH_ACK", ok: false, error: String(e) },
        window.location.origin,
      );
    }
  });

  // ---------- 2. ATS detection ----------
  function detectAts() {
    const host = location.hostname;
    const html = document.documentElement.outerHTML.slice(0, 50_000);
    if (host.includes("greenhouse.io") || /grnhse|greenhouse/i.test(html)) return "greenhouse";
    if (host.includes("lever.co")) return "lever";
    if (host.includes("ashbyhq.com")) return "ashby";
    if (host.includes("myworkdayjobs.com") || host.includes("workday")) return "workday";
    if (host.includes("smartrecruiters.com")) return "smartrecruiters";
    if (host.includes("jobvite.com")) return "jobvite";
    if (host.includes("icims.com")) return "icims";
    if (host.includes("linkedin.com")) return "linkedin";
    if (host.includes("indeed.com")) return "indeed";
    if (host.includes("bamboohr.com")) return "bamboohr";
    if (host.includes("breezy.hr")) return "breezy";
    if (host.includes("recruitee.com")) return "recruitee";
    if (host.includes("workable.com")) return "workable";
    return "generic";
  }

  // ---------- 3. Field discovery ----------
  function visible(el) {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false;
    const cs = getComputedStyle(el);
    return cs.display !== "none" && cs.visibility !== "hidden";
  }

  function labelFor(input) {
    if (input.id) {
      const lbl = document.querySelector(`label[for="${CSS.escape(input.id)}"]`);
      if (lbl) return lbl.innerText.trim();
    }
    const parentLabel = input.closest("label");
    if (parentLabel) return parentLabel.innerText.trim();
    const aria = input.getAttribute("aria-label") || input.getAttribute("aria-labelledby");
    if (aria) {
      const byId = document.getElementById(aria);
      if (byId) return byId.innerText.trim();
      return aria;
    }
    // Look for a nearby preceding label/span/div
    let prev = input.previousElementSibling;
    for (let i = 0; i < 3 && prev; i++, prev = prev.previousElementSibling) {
      const t = prev.innerText?.trim();
      if (t && t.length < 120) return t;
    }
    return input.placeholder || input.name || "";
  }

  function scanFields() {
    const inputs = Array.from(
      document.querySelectorAll(
        'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select',
      ),
    ).filter(visible);
    return inputs.map((el, idx) => ({
      idx,
      tag: el.tagName.toLowerCase(),
      type: el.type || null,
      name: el.name || null,
      id: el.id || null,
      label: labelFor(el),
      placeholder: el.placeholder || null,
      required: !!el.required,
      currentValue: el.value || "",
    }));
  }

  // ---------- 4. Field mapping ----------
  // Heuristic mapping from a field descriptor to a key in the context payload.
  const MAPPERS = [
    { key: "full_name", match: /(full[\s_-]*name|your name|legal name)/i },
    { key: "first_name", match: /(first[\s_-]*name|given name|forename)/i },
    { key: "last_name", match: /(last[\s_-]*name|surname|family name)/i },
    { key: "email", match: /e[\s_-]*mail/i },
    { key: "phone", match: /(phone|mobile|telephone)/i },
    { key: "location", match: /(city|location|where.*based|address)/i },
    { key: "linkedin_url", match: /linkedin/i },
    { key: "portfolio_url", match: /(portfolio|website|personal\s*site|github)/i },
    { key: "work_authorization", match: /(authoriz|authorise|right to work|legally.*work|work permit)/i },
    { key: "requires_sponsorship", match: /(sponsor|visa.*support)/i },
    { key: "cover_letter", match: /(cover[\s_-]*letter|why.*you|why.*us|tell us about)/i },
    { key: "resume_text", match: /(resume|cv|paste.*resume)/i },
    { key: "salary", match: /(salary|compensation expect|expected.*pay)/i },
    { key: "notice_period", match: /(notice period|start date|availability)/i },
  ];

  function fieldKey(f) {
    const blob = [f.label, f.name, f.id, f.placeholder].filter(Boolean).join(" ");
    for (const m of MAPPERS) if (m.match.test(blob)) return m.key;
    return null;
  }

  function setNativeValue(el, value) {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function fillField(f, value) {
    const el =
      (f.id && document.getElementById(f.id)) ||
      (f.name && document.querySelector(`[name="${CSS.escape(f.name)}"]`)) ||
      Array.from(
        document.querySelectorAll('input:not([type="hidden"]), textarea, select'),
      ).filter(visible)[f.idx];
    if (!el) return false;
    if (el.tagName === "SELECT") {
      const target = String(value).toLowerCase();
      const opt = Array.from(el.options).find(
        (o) => o.value.toLowerCase() === target || o.text.toLowerCase().includes(target),
      );
      if (opt) {
        el.value = opt.value;
        el.dispatchEvent(new Event("change", { bubbles: true }));
        return true;
      }
      return false;
    }
    if (el.type === "checkbox") {
      const want = ["yes", "true", "1", "y"].includes(String(value).toLowerCase());
      if (el.checked !== want) el.click();
      return true;
    }
    if (el.type === "radio") {
      const group = document.getElementsByName(el.name);
      const want = String(value).toLowerCase();
      for (const r of group) {
        const lbl = labelFor(r).toLowerCase();
        if (lbl.includes(want) || r.value.toLowerCase() === want) {
          r.click();
          return true;
        }
      }
      return false;
    }
    setNativeValue(el, String(value ?? ""));
    return true;
  }

  // ---------- 5. Public command handler ----------
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      try {
        if (msg?.type === "PING_PAGE") {
          sendResponse({ ok: true, ats: detectAts(), url: location.href, title: document.title });
          return;
        }
        if (msg?.type === "SCAN_FIELDS") {
          const fields = scanFields();
          sendResponse({
            ok: true,
            ats: detectAts(),
            url: location.href,
            title: document.title,
            fields,
            mapped: fields.map((f) => ({ idx: f.idx, label: f.label, key: fieldKey(f) })),
          });
          return;
        }
        if (msg?.type === "AUTOFILL") {
          const ctx = msg.context || {};
          const fields = scanFields();
          const events = [];
          let filled = 0,
            skipped = 0;
          for (const f of fields) {
            const key = fieldKey(f);
            if (!key) {
              skipped++;
              continue;
            }
            // Prefer per-field AI answer if provided
            const aiAnswer = (ctx.answers || {})[key] ?? (ctx.answers || {})[f.label];
            const value = aiAnswer ?? ctx.profile?.[key] ?? null;
            if (value == null || value === "") {
              events.push({ idx: f.idx, label: f.label, key, status: "no_value" });
              skipped++;
              continue;
            }
            const ok = fillField(f, value);
            events.push({ idx: f.idx, label: f.label, key, status: ok ? "filled" : "failed" });
            if (ok) filled++;
            else skipped++;
            await new Promise((r) => setTimeout(r, 40));
          }
          sendResponse({ ok: true, filled, skipped, events, total: fields.length });
          return;
        }
        sendResponse({ ok: false, error: "unknown command" });
      } catch (e) {
        sendResponse({ ok: false, error: e?.message || String(e) });
      }
    })();
    return true;
  });
})();
