# CareerOS

Multi-tenant AI job search and application copilot built on TanStack Start + Supabase + Mistral AI.

## What it does

- Ingest resumes and knowledge-base documents (chunked + embedded for RAG).
- Ingest jobs manually, by pasting URLs, or via free text (AI extraction).
- Rank jobs against the candidate using a multi-factor score
  (`0.4·semantic + 0.35·skills + 0.15·location + 0.1·eligibility`).
- Generate ATS-friendly tailored resumes, cover letters, and grounded
  application answers via Mistral AI.
- Draft browser submission plans for third-party career sites and queue them
  for explicit human review before anything is sent.
- Track the full application lifecycle with analytics.

## Architecture

- **Frontend**: TanStack Start v1 (React 19, file-based routing under `src/routes/`).
- **Server logic**: `createServerFn` handlers in `src/lib/*.functions.ts`.
- **Database**: Postgres via a personal **Supabase** instance with `pgvector` for embeddings, and RLS scoped to `auth.uid()` on every user-owned table.
- **AI**: **Mistral AI** (`mistral-large-latest` for high-quality generation/tailoring, `mistral-small-latest` for fast parsing/ranking) via `@ai-sdk/mistral`, reading `MISTRAL_API_KEY` from your environment.

## Getting Started (Local Development)

### Prerequisites

- **Node.js**: version 22 or higher (recommended for TanStack Start).
- **Supabase**: A free Supabase account and project.
- **Mistral AI**: A Mistral API key.

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Configure Environment Variables

Create a `.env` file in the root of the project (this file is ignored by Git to protect your secrets):

```env
SUPABASE_PROJECT_ID="your-supabase-project-id"
SUPABASE_PUBLISHABLE_KEY="your-supabase-anon-public-key"
MISTRAL_API_KEY="your-mistral-api-key"
```

### Step 3: Set Up Database

1. In your Supabase Dashboard, open your project's **SQL Editor**.
2. Create a new query, paste the contents of [supabase/careeros_setup.sql](file:///c:/Users/Vivek/Desktop/CareerOS/supabase/careeros_setup.sql), and run it. This sets up all tables, schemas, indexes, and Row-Level Security (RLS) policies.

### Step 4: Configure Authentication

1. Go to **Auth -> URL Configuration** in your Supabase Dashboard:
   - **Site URL**: `http://localhost:8080`
   - **Redirect URLs**: Add `http://localhost:8080/**`
2. If you want Google Login, enable the Google Provider under **Auth -> Providers** and configure it with your Google Cloud Console Client ID and Secret (using `https://<your-project-id>.supabase.co/auth/v1/callback` as the callback URI).

### Step 5: Configure Storage

1. Go to **Storage** in your Supabase Dashboard.
2. Create a new bucket named **`jobpilot-documents`**.
3. Keep the bucket **Private** (do NOT toggle public).

### Step 6: Start Dev Server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## Browser automation safety model

Real browser drivers (Playwright/Puppeteer) can't run inside the serverless Worker runtime, and auto-submitting on third-party ATS sites without consent is unsafe. Instead CareerOS:

1. Fetches the application page HTML server-side.
2. Asks the AI to produce a deterministic, selector-based submission plan grounded in the candidate's tailored materials.
3. Queues the plan in `review_queue` for explicit human approval.
4. Only marks the application as `submitted` after the user confirms, optionally recording an external reference id and notes.

This keeps the user firmly in the loop on every sensitive action.

## Key routes

| Route | Purpose |
| --- | --- |
| `/dashboard` | Top matches and pipeline overview |
| `/jobs` | Browse, ingest, and rank jobs |
| `/jobs/$jobId` | Match breakdown + tailoring tools |
| `/applications` | Pipeline board with browser-assist actions |
| `/review` | Human approval of AI-drafted submission plans |
| `/documents` | Resume and knowledge-base management |
| `/analytics` | Funnel + match-quality metrics |
| `/settings` | Profile, preferences, eligibility |

## Conventions

- Never edit `src/integrations/supabase/*` or `src/routeTree.gen.ts`.
- New server-side logic goes in `src/lib/*.functions.ts` (never Edge Functions).
- Read secrets from `process.env` inside `.handler()`.
- RLS is required on every user-owned table; check policies before adding new ones.
