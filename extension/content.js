// CareerOS content script — runs on every page.
// Responsibilities:
//   1. On CareerOS connect page: receive Supabase tokens via window.postMessage and forward to background.
//   2. On job application pages: detect form fields and map to candidate data.
//   3. On job listing pages: parse job posting metadata and full description for 1-click import into CareerOS.

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

  // ---------- 2. ATS & Platform detection ----------
  function detectAts() {
    const host = location.hostname;
    const html = document.documentElement.outerHTML.slice(0, 50_000);
    if (host.includes("greenhouse.io") || /grnhse|greenhouse/i.test(html)) return "Greenhouse";
    if (host.includes("lever.co")) return "Lever";
    if (host.includes("ashbyhq.com")) return "Ashby";
    if (host.includes("myworkdayjobs.com") || host.includes("workday")) return "Workday";
    if (host.includes("smartrecruiters.com")) return "SmartRecruiters";
    if (host.includes("jobvite.com")) return "Jobvite";
    if (host.includes("icims.com")) return "iCIMS";
    if (host.includes("linkedin.com")) return "LinkedIn";
    if (host.includes("indeed.com")) return "Indeed";
    if (host.includes("wellfound.com")) return "Wellfound";
    if (host.includes("ycombinator.com")) return "YCombinator";
    if (host.includes("bamboohr.com")) return "BambooHR";
    if (host.includes("workable.com")) return "Workable";
    return "Generic";
  }

  // ---------- 3. Job Description Extractor ----------
  function extractJobDetails() {
    let title = "";
    let company = "";
    let location = "";
    let description = "";
    let remote = false;

    // A. Check JSON-LD schema.org/JobPosting
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const s of scripts) {
      try {
        const data = JSON.parse(s.innerText);
        const item = Array.isArray(data) ? data.find((d) => d["@type"] === "JobPosting") : data["@type"] === "JobPosting" ? data : null;
        if (item) {
          title = item.title || "";
          company = item.hiringOrganization?.name || "";
          location = item.jobLocation?.address?.addressLocality || item.jobLocation?.address?.addressRegion || "";
          description = item.description || "";
          if (/remote|telecommute/i.test(item.jobLocationType || "") || /remote/i.test(description)) {
            remote = true;
          }
          break;
        }
      } catch {
        // ignore JSON parse error
      }
    }

    // B. Platform-specific fallback heuristics
    const host = window.location.hostname;

    if (host.includes("linkedin.com")) {
      title = title || document.querySelector(".job-details-jobs-unified-top-card__job-title, .topcard__title, h1")?.innerText?.trim() || "";
      company = company || document.querySelector(".job-details-jobs-unified-top-card__company-name, .topcard__org-name-link")?.innerText?.trim() || "";
      location = location || document.querySelector(".job-details-jobs-unified-top-card__bullet, .topcard__flavor--bullet")?.innerText?.trim() || "";
      description = description || document.querySelector(".jobs-description__content, #job-details")?.innerText?.trim() || "";
    } else if (host.includes("greenhouse.io")) {
      title = title || document.querySelector("#header .app-title, .job-name, h1")?.innerText?.trim() || "";
      company = company || document.querySelector("#header .company-name, .company-name")?.innerText?.trim() || "";
      location = location || document.querySelector(".location")?.innerText?.trim() || "";
      description = description || document.querySelector("#content, #main")?.innerText?.trim() || "";
    } else if (host.includes("lever.co")) {
      title = title || document.querySelector(".posting-headline h2, h2")?.innerText?.trim() || "";
      company = company || document.querySelector(".main-header-logo img")?.getAttribute("alt") || "";
      location = location || document.querySelector(".posting-categories .location")?.innerText?.trim() || "";
      description = description || document.querySelector(".section.page-centered")?.innerText?.trim() || "";
    } else if (host.includes("ashbyhq.com")) {
      title = title || document.querySelector(".ashby-job-posting-heading, h1")?.innerText?.trim() || "";
      location = location || document.querySelector(".ashby-job-posting-heading-secondary")?.innerText?.trim() || "";
      description = description || document.querySelector(".ashby-job-posting-description")?.innerText?.trim() || "";
    } else if (host.includes("indeed.com")) {
      title = title || document.querySelector(".jobsearch-JobInfoHeader-title, h1")?.innerText?.trim() || "";
      company = company || document.querySelector('[data-company-name="true"]')?.innerText?.trim() || "";
      location = location || document.querySelector(".jobsearch-JobInfoHeader-companyLocation")?.innerText?.trim() || "";
      description = description || document.querySelector("#jobDescriptionText")?.innerText?.trim() || "";
    }

    // Generic fallbacks
    if (!title) {
      title = document.querySelector("h1")?.innerText?.trim() || document.title.split(/[-|·]/)[0]?.trim() || "Untitled Position";
    }
    if (!company) {
      const parts = document.title.split(/[-|·]/);
      company = parts.length > 1 ? parts[1]?.trim() : host.split(".")[0]?.toUpperCase();
    }
    if (!description) {
      description = document.querySelector("article, main, #main-content, #content, .content")?.innerText?.trim() || document.body.innerText.slice(0, 5000);
    }
    if (/remote|wfh|work from home/i.test(`${title} ${location} ${description.slice(0, 500)}`)) {
      remote = true;
    }

    return {
      title: title.replace(/\s+/g, " ").trim(),
      company: company.replace(/\s+/g, " ").trim(),
      location: location.replace(/\s+/g, " ").trim() || (remote ? "Remote" : null),
      remote,
      description: description.slice(0, 30_000).trim(),
      source_url: window.location.href,
      ats: detectAts(),
    };
  }

  // ---------- 4. Field discovery ----------
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

  // ---------- 5. Field mapping ----------
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

  // ---------- 6. Public message handler ----------
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    (async () => {
      try {
        if (msg?.type === "PING_PAGE") {
          sendResponse({ ok: true, ats: detectAts(), url: location.href, title: document.title });
          return;
        }
        if (msg?.type === "EXTRACT_JOB_DETAILS") {
          const details = extractJobDetails();
          sendResponse({ ok: true, details });
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
