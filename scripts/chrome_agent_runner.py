#!/usr/bin/env python3
"""
CareerOS Chrome CDP Agent Runner & Job Discovery Crawler
Connects to Google Chrome via Chrome DevTools Protocol (CDP) on localhost:9222
and executes automated, anti-bot-resistant job search discovery and application autofill.

Usage:
  1. Launch Chrome with remote debugging:
     # Windows:
     & "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222
     # macOS:
     /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222
     # Linux:
     google-chrome --remote-debugging-port=9222

  2. Auto-crawl & search jobs:
     python scripts/chrome_agent_runner.py --search "AI Python Developer" --location "Remote" --token "<TOKEN>"

  3. Auto-apply to a job:
     python scripts/chrome_agent_runner.py --url "https://boards.greenhouse.io/..." --token "<TOKEN>"
"""

import argparse
import asyncio
import json
import os
import sys
import time
from typing import Any, Dict, List, Optional
import urllib.request
import urllib.parse

try:
    import websockets
except ImportError:
    print("[!] Notice: 'websockets' library is recommended for real-time CDP streaming.")
    print("    Install via: pip install websockets\n")

DEFAULT_API_URL = os.environ.get("CAREEROS_API_URL", "http://localhost:8080")
DEFAULT_CDP_PORT = int(os.environ.get("CDP_PORT", "9222"))


class ChromeCdpClient:
    def __init__(self, port: int = DEFAULT_CDP_PORT):
        self.port = port
        self.ws_url: Optional[str] = None
        self.ws = None
        self.msg_id = 1
        self.pending_responses: Dict[int, asyncio.Future] = {}

    def is_chrome_running(self) -> bool:
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{self.port}/json/version")
            with urllib.request.urlopen(req, timeout=2) as resp:
                data = json.loads(resp.read().decode())
                self.ws_url = data.get("webSocketDebuggerUrl")
                return True
        except Exception:
            return False

    def get_tabs(self) -> List[Dict[str, Any]]:
        try:
            req = urllib.request.Request(f"http://127.0.0.1:{self.port}/json/list")
            with urllib.request.urlopen(req, timeout=3) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            print(f"[!] Error fetching Chrome tabs: {e}")
            return []

    async def connect(self, target_ws_url: Optional[str] = None):
        import websockets
        url = target_ws_url or self.ws_url
        if not url:
            raise ValueError("No WebSocket Debugger URL available.")
        self.ws = await websockets.connect(url, max_size=20_000_000)
        asyncio.create_task(self._listen_loop())

    async def _listen_loop(self):
        try:
            async for raw in self.ws:
                msg = json.loads(raw)
                _id = msg.get("id")
                if _id in self.pending_responses:
                    fut = self.pending_responses.pop(_id)
                    if "error" in msg:
                        fut.set_exception(RuntimeError(msg["error"].get("message", "CDP error")))
                    else:
                        fut.set_result(msg.get("result", {}))
        except Exception:
            pass

    async def send_command(self, method: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not self.ws:
            raise RuntimeError("CDP client is not connected.")
        curr_id = self.msg_id
        self.msg_id += 1
        payload = {"id": curr_id, "method": method, "params": params or {}}
        fut = asyncio.get_running_loop().create_future()
        self.pending_responses[curr_id] = fut
        await self.ws.send(json.dumps(payload))
        return await asyncio.wait_for(fut, timeout=15)

    async def evaluate_js(self, expression: str) -> Any:
        res = await self.send_command("Runtime.evaluate", {
            "expression": expression,
            "returnByValue": True,
            "awaitPromise": True,
        })
        return res.get("result", {}).get("value")

    async def close(self):
        if self.ws:
            await self.ws.close()


def fetch_agent_plan_from_careeros(api_url: str, token: str, job_url: str) -> Dict[str, Any]:
    url = f"{api_url}/api/public/extension/agent-plan"
    data = json.dumps({"job_url": job_url}).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        res = json.loads(resp.read().decode())
        return res.get("plan", {})


def import_job_to_careeros(api_url: str, token: str, job_data: Dict[str, Any]) -> Dict[str, Any]:
    url = f"{api_url}/api/public/extension/import-job"
    data = json.dumps(job_data).encode()
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode())


async def run_cdp_autofill(port: int, job_url: str, plan: Dict[str, Any]):
    client = ChromeCdpClient(port=port)
    if not client.is_chrome_running():
        print(f"[!] Chrome is not running with remote debugging on port {port}.")
        print("[*] Launch Chrome with:")
        print(f'    chrome.exe --remote-debugging-port={port}')
        return False

    tabs = client.get_tabs()
    page_tab = next((t for t in tabs if t.get("type") == "page"), None)
    if not page_tab:
        print("[!] No active page tabs found in Chrome.")
        return False

    ws_url = page_tab.get("webSocketDebuggerUrl")
    print(f"[*] Attaching CDP to Tab: {page_tab.get('title', 'Untitled')} ({page_tab.get('url', '')})")
    await client.connect(ws_url)

    await client.send_command("DOM.enable")
    await client.send_command("Page.enable")
    await client.send_command("Runtime.enable")

    current_url = page_tab.get("url", "")
    if job_url and job_url not in current_url:
        print(f"[*] Navigating to {job_url}...")
        await client.send_command("Page.navigate", {"url": job_url})
        await asyncio.sleep(2.5)

    candidate = plan.get("candidate", {})
    answers = plan.get("answers", {})

    print(f"[*] Filling form for candidate: {candidate.get('full_name')} ({candidate.get('email')})...")

    fill_script = f"""
    (() => {{
      const candidate = {json.dumps(candidate)};
      const answers = {json.dumps(answers)};
      const results = [];

      const mappers = [
        {{ key: "first_name", val: candidate.first_name, test: /first[\\s_-]*name|given/i }},
        {{ key: "last_name", val: candidate.last_name, test: /last[\\s_-]*name|surname/i }},
        {{ key: "full_name", val: candidate.full_name, test: /full[\\s_-]*name|your name|legal/i }},
        {{ key: "email", val: candidate.email, test: /e[\\s_-]*mail/i }},
        {{ key: "phone", val: candidate.phone, test: /phone|mobile|cell/i }},
        {{ key: "location", val: candidate.location, test: /city|location|address/i }},
        {{ key: "linkedin_url", val: candidate.linkedin_url, test: /linkedin/i }},
        {{ key: "portfolio_url", val: candidate.portfolio_url, test: /portfolio|website|github/i }},
        {{ key: "salary", val: candidate.salary_expectations, test: /salary|compensation/i }},
        {{ key: "work_auth", val: candidate.work_authorization, test: /authoriz|work permit/i }},
      ];

      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'));
      
      inputs.forEach((el, idx) => {{
        const desc = `${{el.id || ""}} ${{el.name || ""}} ${{el.placeholder || ""}} ${{el.getAttribute('aria-label') || ""}}`;
        let targetVal = null;
        let matchedKey = null;

        for (const m of mappers) {{
          if (m.test.test(desc) && m.val) {{
            targetVal = m.val;
            matchedKey = m.key;
            break;
          }}
        }}

        if (!targetVal && answers[desc.trim()]) {{
          targetVal = answers[desc.trim()];
          matchedKey = desc.trim();
        }}

        if (targetVal) {{
          el.focus();
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
          if (setter) setter.call(el, targetVal);
          else el.value = targetVal;
          el.dispatchEvent(new Event('input', {{ bubbles: true }}));
          el.dispatchEvent(new Event('change', {{ bubbles: true }}));
          el.dispatchEvent(new Event('blur', {{ bubbles: true }}));
          results.push({{ idx, name: el.name || el.id, matchedKey, val: targetVal }});
        }}
      }});

      return results;
    }})()
    """

    res = await client.evaluate_js(fill_script)
    filled_items = res or []
    print(f"[✓] Filled {len(filled_items)} fields via CDP:")
    for item in filled_items:
        print(f"    - {item.get('matchedKey')} -> {item.get('name') or '(field)'}")

    print("\n[✓] CDP Agent autofill complete. Review your application in Chrome and submit when ready!")
    await client.close()
    return True


async def run_cdp_job_search(port: int, query: str, location: Optional[str], site: str, api_url: str, token: Optional[str]):
    client = ChromeCdpClient(port=port)
    if not client.is_chrome_running():
        print(f"[!] Chrome is not running with remote debugging on port {port}.")
        print("[*] Launch Chrome with:")
        print(f'    chrome.exe --remote-debugging-port={port}')
        return False

    tabs = client.get_tabs()
    page_tab = next((t for t in tabs if t.get("type") == "page"), None)
    if not page_tab:
        print("[!] No active page tabs found in Chrome.")
        return False

    ws_url = page_tab.get("webSocketDebuggerUrl")
    print(f"[*] Attaching CDP Search Agent to Tab: {page_tab.get('title', '')}")
    await client.connect(ws_url)

    await client.send_command("DOM.enable")
    await client.send_command("Page.enable")
    await client.send_command("Runtime.enable")

    # Build Search URL
    q_encoded = urllib.parse.quote(query)
    loc_encoded = urllib.parse.quote(location or "India")

    if site == "linkedin":
        search_url = f"https://www.linkedin.com/jobs/search/?keywords={q_encoded}&location={loc_encoded}&f_E=1%2C2&f_TPR=r86400"
    elif site == "naukri":
        search_url = f"https://www.naukri.com/{q_encoded.lower().replace('%20', '-')}-jobs-in-{loc_encoded.lower().replace('%20', '-')}?experience=0"
    elif site == "google":
        search_url = f"https://www.google.com/search?q={q_encoded}+fresher+jobs+{loc_encoded}&ibp=htl;jobs"
    else:
        search_url = f"https://www.google.com/search?q=site:boards.greenhouse.io+OR+site:jobs.lever.co+OR+site:jobs.ashbyhq.com+{q_encoded}+fresher+{loc_encoded}"

    print(f"[*] Navigating CDP Agent to search portal: {search_url}")
    await client.send_command("Page.navigate", {"url": search_url})
    await asyncio.sleep(4.0)

    # Scroll page to trigger dynamic load
    print("[*] Scrolling search results via CDP...")
    for _ in range(3):
        await client.evaluate_js("window.scrollBy(0, 800);")
        await asyncio.sleep(1.2)

    # Extract Job Cards via JS evaluation
    extract_script = """
    (() => {
      const jobs = [];
      const host = window.location.hostname;

      if (host.includes("linkedin.com")) {
        const cards = document.querySelectorAll(".job-card-container, .jobs-search-results__list-item, .base-card");
        cards.forEach((c) => {
          const title = c.querySelector(".job-card-list__title, .base-search-card__title, h3")?.innerText?.trim();
          const comp = c.querySelector(".job-card-container__primary-description, .base-search-card__subtitle")?.innerText?.trim();
          const loc = c.querySelector(".job-card-container__metadata-item, .job-search-card__location")?.innerText?.trim();
          const link = c.querySelector("a.job-card-list__title, a.base-card__full-link")?.href;
          if (title && link) {
            jobs.push({ title, company: comp || 'Unknown', location: loc || 'Remote', remote: /remote/i.test(`${title} ${loc}`), url: link });
          }
        });
      } else {
        // Generic / Google search extraction
        const links = Array.from(document.querySelectorAll("a[href]"));
        links.forEach((a) => {
          const href = a.href;
          const text = a.innerText.trim();
          if (/(greenhouse\\.io|lever\\.co|ashbyhq\\.com|myworkdayjobs\\.com)/i.test(href) && text.length > 5) {
            jobs.push({ title: text, company: new URL(href).hostname.split('.')[0], location: 'Remote', remote: true, url: href });
          }
        });
      }

      return jobs.slice(0, 15);
    })()
    """

    res = await client.evaluate_js(extract_script)
    discovered_jobs = res or []
    print(f"\n[✓] Discovered {len(discovered_jobs)} matching job listings via CDP:")

    for i, j in enumerate(discovered_jobs, 1):
        print(f"  {i}. {j.get('title')} @ {j.get('company')} ({j.get('location')})")
        print(f"     URL: {j.get('url')}")

        if token:
            try:
                import_res = import_job_to_careeros(api_url, token, {
                    "title": j.get("title"),
                    "company": j.get("company"),
                    "location": j.get("location"),
                    "remote": j.get("remote", False),
                    "source_url": j.get("url"),
                    "description": f"{j.get('title')} at {j.get('company')}",
                })
                status = "Existing" if import_res.get("already_exists") else "Imported ✓"
                print(f"     -> CareerOS Status: {status} (ID: {import_res.get('job_id')})")
            except Exception as e:
                print(f"     -> Failed to import: {e}")

    print("\n[✓] CDP Job Discovery complete! View and rank newly imported jobs in CareerOS.")
    await client.close()
    return True


def main():
    parser = argparse.ArgumentParser(description="CareerOS Chrome CDP Agent Runner & Job Discovery Crawler")
    parser.add_argument("--url", help="Job application URL to autofill")
    parser.add_argument("--search", help="Search query to discover jobs via CDP (e.g. 'Python Fresher', 'AI Developer')")
    parser.add_argument("--location", default="India", help="Job location filter (default: 'India')")
    parser.add_argument("--site", choices=["linkedin", "naukri", "google", "ats"], default="linkedin", help="Target search site (default: linkedin)")
    parser.add_argument("--port", type=int, default=DEFAULT_CDP_PORT, help=f"Chrome CDP port (default: {DEFAULT_CDP_PORT})")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help=f"CareerOS API base URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--token", help="CareerOS Bearer auth token")
    parser.add_argument("--test-cdp", action="store_true", help="Test connection to local Chrome DevTools port")

    args = parser.parse_args()

    client = ChromeCdpClient(port=args.port)

    if args.test_cdp:
        print(f"[*] Testing connection to Chrome on port {args.port}...")
        if client.is_chrome_running():
            print(f"[✓] Chrome DevTools Protocol detected! (WebSocket: {client.ws_url})")
            tabs = client.get_tabs()
            print(f"[*] Found {len(tabs)} tabs:")
            for t in tabs:
                print(f"    - [{t.get('type')}] {t.get('title', '')[:50]} ({t.get('url', '')[:60]})")
        else:
            print(f"[!] Chrome is not running with --remote-debugging-port={args.port}")
            print("[*] To launch Chrome with CDP enabled:")
            print(f'    chrome.exe --remote-debugging-port={args.port}')
        return

    if args.search:
        print(f"[*] Starting CDP Job Search Crawler for: '{args.search}' in '{args.location}' on '{args.site}'...")
        asyncio.run(run_cdp_job_search(args.port, args.search, args.location, args.site, args.api_url, args.token))
        return

    if not args.url and not args.test_cdp and not args.search:
        print("[!] Please provide a --url, --search, or use --test-cdp. Examples:")
        print("    python scripts/chrome_agent_runner.py --search 'Python AI Developer' --location 'Remote'")
        print("    python scripts/chrome_agent_runner.py --url 'https://boards.greenhouse.io/...'")
        return

    plan = {
        "candidate": {
            "full_name": os.environ.get("CANDIDATE_NAME", "Candidate User"),
            "email": os.environ.get("CANDIDATE_EMAIL", "candidate@example.com"),
            "phone": "+1 555-0199",
            "location": "San Francisco, CA",
            "linkedin_url": "https://linkedin.com/in/candidate",
            "portfolio_url": "https://github.com/candidate",
            "work_authorization": "US Citizen / Authorized",
        },
        "answers": {},
    }

    if args.token:
        try:
            print(f"[*] Fetching agent plan from CareerOS ({args.api_url})...")
            plan = fetch_agent_plan_from_careeros(args.api_url, args.token, args.url)
        except Exception as e:
            print(f"[!] Failed to fetch plan from API ({e}), using default candidate profile.")

    asyncio.run(run_cdp_autofill(args.port, args.url, plan))


if __name__ == "__main__":
    main()
