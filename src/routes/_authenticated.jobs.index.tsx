import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useEffect, useMemo, useState } from "react";
import {
  Trash2,
  ExternalLink,
  Plus,
  Sparkles,
  Wand2,
  Link2,
  Globe,
  Filter,
  X,
  Loader2,
  GraduationCap,
  Mic,
  Sprout,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { listJobs, deleteJob, ingestJobFromUrl } from "@/lib/jobs.functions";
import { searchJobsWeb, importDiscoveredJob } from "@/lib/jobsearch.functions";
import { rankAllJobs } from "@/lib/ranking.functions";
import { listApplications } from "@/lib/applications.functions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { z } from "zod";

const jobsSearchSchema = z.object({
  q: z.string().optional(),
  loc: z.string().optional(),
  search: z.union([z.string(), z.boolean()]).optional(),
});

export const Route = createFileRoute("/_authenticated/jobs/")({
  validateSearch: (search) => jobsSearchSchema.parse(search),
  head: () => ({ meta: [{ title: "Jobs — CareerOS" }] }),
  component: JobsPage,
});

type SortKey = "rank" | "newest" | "oldest" | "title" | "company";
type RemoteFilter = "any" | "remote" | "onsite";

const SOURCES = [
  { name: "Naukri", domain: "naukri.com" },
  { name: "LinkedIn India", domain: "linkedin.com" },
  { name: "Instahyre", domain: "instahyre.com" },
  { name: "Cutshort", domain: "cutshort.io" },
  { name: "Foundit", domain: "foundit.in" },
  { name: "Hirist", domain: "hirist.tech" },
  { name: "Internshala", domain: "internshala.com" },
];

function SearchingOverlay({ query, location }: { query: string; location: string }) {
  const target = `${query || "your target roles"}${location ? ` near ${location}` : ""}`;
  const phases = useMemo(
    () => [
      `Building search for ${target}…`,
      ...SOURCES.map((s) => `Querying ${s.name}…`),
      "Scoring against your profile…",
      "Filtering duplicates & low-signal posts…",
      "Ingesting into your jobs list…",
    ],
    [target],
  );
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % phases.length), 1400);
    return () => clearInterval(t);
  }, [phases.length]);

  return (
    <div className="mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-background/60 px-3 py-2 text-sm">
      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
      <span key={i} className="truncate text-muted-foreground animate-fade-in">
        {phases[i]}
      </span>
    </div>
  );
}

function JobsPage() {
  const qc = useQueryClient();
  const searchParams = Route.useSearch();
  const fn = useServerFn(listJobs);
  const del = useServerFn(deleteJob);
  const rankAll = useServerFn(rankAllJobs);
  const ingest = useServerFn(ingestJobFromUrl);
  const search = useServerFn(searchJobsWeb);
  const importJobFn = useServerFn(importDiscoveredJob);
  const appsFn = useServerFn(listApplications);
  const { data, isLoading } = useQuery({ queryKey: ["jobs"], queryFn: () => fn() });
  const apps = useQuery({ queryKey: ["applications"], queryFn: () => appsFn() });

  const [url, setUrl] = useState("");
  const [rawText, setRawText] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [searchLoc, setSearchLoc] = useState("");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [searchMode, setSearchMode] = useState<"any" | "entry_level">("any");
  const [searching, setSearching] = useState(false);

  const [discoveredJobs, setDiscoveredJobs] = useState<any[] | null>(null);
  const [importingJobUrl, setImportingJobUrl] = useState<string | null>(null);
  const [importingAll, setImportingAll] = useState(false);

  // Load state from sessionStorage on mount
  useEffect(() => {
    try {
      const qVal = sessionStorage.getItem("career_os_search_q");
      const locVal = sessionStorage.getItem("career_os_search_loc");
      const jobsVal = sessionStorage.getItem("career_os_discovered_jobs");
      if (qVal) setSearchQ(qVal);
      if (locVal) setSearchLoc(locVal);
      if (jobsVal) setDiscoveredJobs(JSON.parse(jobsVal));
    } catch (e) {
      console.error("Failed to load sessionStorage state", e);
    }
  }, []);

  // Update sessionStorage when state changes
  useEffect(() => {
    try {
      if (searchQ) sessionStorage.setItem("career_os_search_q", searchQ);
      else sessionStorage.removeItem("career_os_search_q");
    } catch {}
  }, [searchQ]);

  useEffect(() => {
    try {
      if (searchLoc) sessionStorage.setItem("career_os_search_loc", searchLoc);
      else sessionStorage.removeItem("career_os_search_loc");
    } catch {}
  }, [searchLoc]);

  useEffect(() => {
    try {
      if (discoveredJobs) {
        sessionStorage.setItem("career_os_discovered_jobs", JSON.stringify(discoveredJobs));
      } else {
        sessionStorage.removeItem("career_os_discovered_jobs");
      }
    } catch {}
  }, [discoveredJobs]);

  // Trigger search if routed with params (overwrites sessionStorage)
  useEffect(() => {
    if (searchParams.q) {
      setSearchQ(searchParams.q);
    }
    if (searchParams.loc) {
      setSearchLoc(searchParams.loc);
    }
    if (searchParams.search) {
      const runSearch = async () => {
        setSearching(true);
        setDiscoveredJobs(null);
        try {
          const res = await search({
            data: {
              query: searchParams.q || undefined,
              location: searchParams.loc || undefined,
              remoteOnly: false,
              mode: "any",
              limit: 40,
            },
          });
          if (res.error) {
            toast.error(res.error);
            return;
          }
          if (res.success && res.jobs) {
            setDiscoveredJobs(res.jobs);
            if (res.jobs.length === 0) {
              toast.info("No matching jobs found.");
            } else {
              toast.success(`Found ${res.jobs.length} active jobs on the web!`);
            }
          }
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Search failed");
        } finally {
          setSearching(false);
        }
      };
      runSearch();
    }
  }, [searchParams.q, searchParams.loc, searchParams.search]);

  // Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [filterLoc, setFilterLoc] = useState("");
  const [filterRemote, setFilterRemote] = useState<RemoteFilter>("any");
  const [filterType, setFilterType] = useState<string>("any");
  const [minMatch, setMinMatch] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortKey>("rank");

  const scoreMap = useMemo(
    () => new Map((apps.data ?? []).map((a) => [a.job_id, { score: a.match_score, status: a.status }])),
    [apps.data],
  );

  const filteredJobs = useMemo(() => {
    let rows = data ?? [];
    const q = filterText.trim().toLowerCase();
    const loc = filterLoc.trim().toLowerCase();
    if (q) rows = rows.filter((j) => `${j.title} ${j.company}`.toLowerCase().includes(q));
    if (loc) rows = rows.filter((j) => (j.location ?? "").toLowerCase().includes(loc));
    if (filterRemote === "remote") rows = rows.filter((j) => j.remote);
    if (filterRemote === "onsite") rows = rows.filter((j) => !j.remote);
    if (filterType !== "any") rows = rows.filter((j) => j.employment_type === filterType);
    const minPct = Number(minMatch);
    if (!Number.isNaN(minPct) && minMatch !== "") {
      rows = rows.filter((j) => {
        const s = scoreMap.get(j.id)?.score;
        return s != null && Math.round(Number(s) * 100) >= minPct;
      });
    }
    const sorted = [...rows];
    sorted.sort((a, b) => {
      if (sortBy === "rank") {
        const sa = Number(scoreMap.get(a.id)?.score ?? -1);
        const sb = Number(scoreMap.get(b.id)?.score ?? -1);
        return sb - sa;
      }
      if (sortBy === "newest") return +new Date(b.created_at) - +new Date(a.created_at);
      if (sortBy === "oldest") return +new Date(a.created_at) - +new Date(b.created_at);
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "company") return a.company.localeCompare(b.company);
      return 0;
    });
    return sorted;
  }, [data, scoreMap, filterText, filterLoc, filterRemote, filterType, minMatch, sortBy]);

  const activeFilterCount =
    (filterText ? 1 : 0) +
    (filterLoc ? 1 : 0) +
    (filterRemote !== "any" ? 1 : 0) +
    (filterType !== "any" ? 1 : 0) +
    (minMatch !== "" ? 1 : 0);

  const clearFilters = () => {
    setFilterText("");
    setFilterLoc("");
    setFilterRemote("any");
    setFilterType("any");
    setMinMatch("");
  };

  const handleDelete = async (id: string) => {
    await del({ data: { id } });
    toast.success("Job removed");
    qc.invalidateQueries({ queryKey: ["jobs"] });
  };

  const handleRankAll = async () => {
    toast.info("Ranking all jobs…");
    try {
      const res = await rankAll();
      toast.success(`Scored ${res.scored} jobs`);
      qc.invalidateQueries({ queryKey: ["applications"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleIngest = async () => {
    const u = url.trim();
    const t = rawText.trim();
    if (!u && t.length < 50) {
      toast.error("Enter a URL or paste the job description.");
      return;
    }
    setIngesting(true);
    try {
      await ingest({ data: { url: u || undefined, rawText: t || undefined } });
      toast.success("Job imported");
      setUrl("");
      setRawText("");
      setShowPaste(false);
      qc.invalidateQueries({ queryKey: ["jobs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import");
    } finally {
      setIngesting(false);
    }
  };

  const handleWebSearch = async () => {
    setSearching(true);
    setDiscoveredJobs(null);
    try {
      const res = await search({
        data: {
          query: searchQ.trim() || undefined,
          location: searchLoc.trim() || undefined,
          remoteOnly,
          mode: searchMode,
          limit: 40,
        },
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      if (res.success && res.jobs) {
        setDiscoveredJobs(res.jobs);
        if (res.jobs.length === 0) {
          toast.info("No matching jobs found. Try a different query or location.");
        } else {
          toast.success(`Found ${res.jobs.length} active jobs on the web!`);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const handleImportJob = async (job: any) => {
    setImportingJobUrl(job.url);
    try {
      const res = await importJobFn({
        data: {
          title: job.title,
          company: job.company,
          location: job.location,
          remote: job.remote,
          url: job.url,
          description: job.description,
        },
      });
      if (res.alreadyExists) {
        toast.info(`${job.title} at ${job.company} is already in your pipeline.`);
      } else {
        toast.success(`Added ${job.title} to pipeline`);
      }
      // Update local status so UI changes to "Added"
      setDiscoveredJobs((prev) =>
        prev
          ? prev.map((j) => (j.url === job.url ? { ...j, alreadyInPipeline: true } : j))
          : null
      );
      qc.invalidateQueries({ queryKey: ["jobs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import job");
    } finally {
      setImportingJobUrl(null);
    }
  };

  const handleImportAll = async () => {
    if (!discoveredJobs || discoveredJobs.length === 0) return;
    const toImport = discoveredJobs.filter((j) => !j.alreadyInPipeline);
    if (toImport.length === 0) {
      toast.info("All discovered jobs are already in your pipeline.");
      return;
    }
    setImportingAll(true);
    let count = 0;
    try {
      for (const job of toImport) {
        await importJobFn({
          data: {
            title: job.title,
            company: job.company,
            location: job.location,
            remote: job.remote,
            url: job.url,
            description: job.description,
          },
        });
        count++;
      }
      toast.success(`Imported ${count} new jobs to your pipeline!`);
      setDiscoveredJobs((prev) =>
        prev ? prev.map((j) => ({ ...j, alreadyInPipeline: true })) : null
      );
      qc.invalidateQueries({ queryKey: ["jobs"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to import some jobs");
    } finally {
      setImportingAll(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Jobs</h1>
          <p className="mt-1 text-sm text-muted-foreground">All discovered opportunities, ranked against your profile.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRankAll}><Wand2 className="mr-2 h-4 w-4" /> Rank all</Button>
          <Button asChild><Link to="/upload"><Plus className="mr-2 h-4 w-4" /> Add manually</Link></Button>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Globe className="h-4 w-4 text-primary" /> Find jobs on the web
          </div>
          <div className="inline-flex rounded-lg border border-border bg-background p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setSearchMode("any")}
              disabled={searching}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 transition ${searchMode === "any" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Globe className="h-3 w-3" /> All roles
            </button>
            <button
              type="button"
              onClick={() => setSearchMode("entry_level")}
              disabled={searching}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 transition ${searchMode === "entry_level" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Sprout className="h-3 w-3" /> Entry-level
            </button>
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <Input
            placeholder="Role or keywords (defaults to your target roles)"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            disabled={searching}
          />
          <Input
            placeholder="Location (optional)"
            value={searchLoc}
            onChange={(e) => setSearchLoc(e.target.value)}
            disabled={searching}
          />
          <Button onClick={handleWebSearch} disabled={searching}>
            {searching ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {searching ? "Searching…" : "Search the web"}
          </Button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={remoteOnly}
            onChange={(e) => setRemoteOnly(e.target.checked)}
            disabled={searching}
          />
          Remote only
        </label>
        {searching && <SearchingOverlay query={searchQ} location={searchLoc} />}
      </div>

      {discoveredJobs && (
        <div className="mb-8 rounded-xl border border-border bg-card/45 p-6 backdrop-blur-sm shadow-lift animate-fade-in">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-accent animate-pulse" />
                Discovered Jobs on the Web ({discoveredJobs.length})
              </h2>
              <p className="text-xs text-muted-foreground">
                Active job postings retrieved and cleaned by AI. Select which roles to import into your pipeline.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleImportAll}
                disabled={importingAll || discoveredJobs.every((j) => j.alreadyInPipeline)}
              >
                {importingAll ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Import All
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setDiscoveredJobs(null)}
                title="Dismiss search results"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {discoveredJobs.map((job) => {
              const getSourceBadge = (source: string) => {
                const src = source.toLowerCase();
                if (src === "linkedin") return "bg-blue-500/10 text-blue-500 border-blue-500/20";
                if (src === "indeed") return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
                if (src === "naukri") return "bg-amber-500/10 text-amber-500 border-amber-500/20";
                if (src === "instahyre" || src === "cutshort" || src === "hirist") return "bg-rose-500/10 text-rose-500 border-rose-500/20";
                return "bg-primary/10 text-primary border-primary/20";
              };

              return (
                <div
                  key={job.url}
                  className="flex flex-col justify-between rounded-xl border border-border bg-card/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/20 hover:shadow-lift"
                >
                  <div>
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <Badge className={getSourceBadge(job.source)} variant="outline">
                        {job.source}
                      </Badge>
                      {job.remote && (
                        <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20" variant="outline">
                          Remote
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-display font-medium leading-snug line-clamp-1 text-foreground" title={job.title}>
                      {job.title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium mb-2">{job.company}</p>
                    {job.location && (
                      <div className="mb-3 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <span className="shrink-0">📍</span>
                        <span className="truncate">{job.location}</span>
                      </div>
                    )}
                    <p className="mb-4 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  <div className="flex gap-2 border-t border-border/55 pt-3">
                    <Button
                      className="flex-1 text-xs"
                      size="sm"
                      variant={job.alreadyInPipeline ? "secondary" : "default"}
                      onClick={() => handleImportJob(job)}
                      disabled={job.alreadyInPipeline || importingJobUrl === job.url}
                    >
                      {importingJobUrl === job.url ? (
                        <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      ) : job.alreadyInPipeline ? (
                        "✓ Added"
                      ) : (
                        "Add to Pipeline"
                      )}
                    </Button>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center rounded-md border border-input bg-background p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      title="View original posting"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mb-8 rounded-xl border border-border bg-card p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium">
          <Link2 className="h-4 w-4 text-primary" /> Import from URL
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="url"
            placeholder="https://company.com/careers/role"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={ingesting}
            onKeyDown={(e) => { if (e.key === "Enter") handleIngest(); }}
          />
          <Button onClick={handleIngest} disabled={ingesting || (!url.trim() && rawText.trim().length < 50)}>
            <Sparkles className="mr-2 h-4 w-4" /> {ingesting ? "Parsing…" : "Import"}
          </Button>
        </div>
        {showPaste && (
          <Textarea
            className="mt-2"
            rows={6}
            placeholder="Paste the full job description here if the URL is blocked…"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            disabled={ingesting}
          />
        )}
        <div className="mt-2 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            We fetch the page server-side and use AI to extract the details. Some sites block bots — paste the text instead.
          </p>
          <button type="button" className="text-xs text-primary hover:underline" onClick={() => setShowPaste((s) => !s)}>
            {showPaste ? "Hide paste" : "Paste description instead"}
          </button>
        </div>
      </div>

      {/* Filter + sort toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Button variant={showFilters ? "default" : "outline"} size="sm" onClick={() => setShowFilters((s) => !s)}>
          <Filter className="mr-2 h-4 w-4" /> Filters
          {activeFilterCount > 0 && <Badge className="ml-2" variant="secondary">{activeFilterCount}</Badge>}
        </Button>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Sort by</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
            <SelectTrigger className="h-8 w-[150px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="rank">Match rank</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
              <SelectItem value="title">Title (A→Z)</SelectItem>
              <SelectItem value="company">Company (A→Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          {filteredJobs.length} of {data?.length ?? 0} jobs
        </span>
      </div>

      {showFilters && (
        <div className="mb-4 grid gap-3 rounded-xl border border-border bg-card p-4 animate-fade-in sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <Label className="text-xs">Title / company</Label>
            <Input className="mt-1" placeholder="e.g. backend, Stripe" value={filterText} onChange={(e) => setFilterText(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Location</Label>
            <Input className="mt-1" placeholder="e.g. Berlin, NYC" value={filterLoc} onChange={(e) => setFilterLoc(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Remote</Label>
            <Select value={filterRemote} onValueChange={(v) => setFilterRemote(v as RemoteFilter)}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="remote">Remote only</SelectItem>
                <SelectItem value="onsite">On-site only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Type</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                <SelectItem value="full_time">Full-time</SelectItem>
                <SelectItem value="part_time">Part-time</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="internship">Internship</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Min match %</Label>
            <Input className="mt-1" inputMode="numeric" placeholder="e.g. 60" value={minMatch} onChange={(e) => setMinMatch(e.target.value.replace(/[^\d]/g, "").slice(0, 3))} />
          </div>
          <div className="sm:col-span-2 lg:col-span-5 flex justify-end">
            <Button variant="ghost" size="sm" onClick={clearFilters} disabled={activeFilterCount === 0}>
              <X className="mr-1 h-3 w-3" /> Clear filters
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : filteredJobs.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Match</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredJobs.map((j) => {
                const meta = scoreMap.get(j.id);
                const pct = meta?.score != null ? Math.round(Number(meta.score) * 100) : null;
                return (
                  <tr key={j.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      {pct == null ? (
                        <span className="text-xs text-muted-foreground">—</span>
                      ) : (
                        <Badge variant={pct >= 75 ? "default" : pct >= 50 ? "secondary" : "outline"}>{pct}%</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <Link to="/jobs/$jobId" params={{ jobId: j.id }} className="hover:underline">{j.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{j.company}</td>
                    <td className="px-4 py-3 text-muted-foreground">{j.remote ? "Remote" : j.location || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {meta?.status ? <Badge variant="outline">{meta.status}</Badge> : <span className="text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        {j.source_url && (
                          <a
                            href={j.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-md p-2 hover:bg-muted"
                            title="Original posting"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" title="More actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem asChild>
                              <Link to="/jobs/$jobId" params={{ jobId: j.id }}>
                                <Eye className="mr-2 h-4 w-4" /> Open details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/jobs/$jobId" params={{ jobId: j.id }} hash="upskill">
                                <GraduationCap className="mr-2 h-4 w-4" /> Upskill plan
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link to="/jobs/$jobId" params={{ jobId: j.id }} hash="interview">
                                <Mic className="mr-2 h-4 w-4" /> Interview prep
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onSelect={() => handleDelete(j.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>


                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (data?.length ?? 0) > 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No jobs match your filters.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={clearFilters}>Clear filters</Button>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No jobs yet.</p>
          <Button asChild className="mt-4"><Link to="/upload">Add your first job</Link></Button>
        </div>
      )}
    </div>
  );
}
