type CandidateDoc = {
  title: string | null;
  kind: string | null;
  extracted_text: string | null;
  is_primary: boolean | null;
};

export async function loadCandidateText(supabase: any, userId: string, maxChars = 20_000) {
  const [{ data: profile }, { data: docs }, { data: savedResumes }] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, headline, location, target_roles, target_locations, linkedin_url, portfolio_url, preferences")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("documents")
      .select("title, kind, extracted_text, is_primary, created_at")
      .eq("user_id", userId)
      .not("extracted_text", "is", null)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("resumes")
      .select("title, content, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(3),
  ]);

  const profileBlock = profile
    ? [
        `Name: ${profile.full_name ?? ""}`,
        `Headline: ${profile.headline ?? ""}`,
        `Location: ${profile.location ?? ""}`,
        `LinkedIn: ${profile.linkedin_url ?? ""}`,
        `Portfolio: ${profile.portfolio_url ?? ""}`,
        `Target roles: ${((profile.target_roles ?? []) as string[]).join(", ")}`,
        `Target locations: ${((profile.target_locations ?? []) as string[]).join(", ")}`,
      ].join("\n")
    : "";

  const styleProfile = (profile?.preferences as { writing_style?: unknown } | null)?.writing_style ?? null;
  const styleDirective = styleProfile
    ? `\n\nWRITING STYLE PREFERENCES:\n${JSON.stringify(styleProfile)}\nApply this voice consistently. Never sacrifice truth or clarity to mimic style.`
    : "";

  const documentBlocks = ((docs ?? []) as CandidateDoc[])
    .filter((doc) => doc.extracted_text?.trim())
    .map((doc) => `DOCUMENT (${doc.kind?.toUpperCase() ?? "GENERAL"} - ${doc.title ?? "Untitled"}): \n${doc.extracted_text!.trim()}`)
    .join("\n\n---\n\n");

  const savedResumeBlocks = (savedResumes ?? [])
    .map((r: any) => `SAVED RESUME STRUCTURE (${r.title || "Resume"}):\n${JSON.stringify(r.content)}`)
    .join("\n\n---\n\n");

  let localContext = "";
  try {
    const fs = await import("fs");
    const path = await import("path");
    const desktopPaths = [
      'C:\\Users\\Vivek\\Desktop\\my certifications\\AnnepuJyothiPrabhashResume_extracted.txt',
      'C:\\Users\\Vivek\\Desktop\\my certifications\\new_resume-1-_extracted.txt',
      'C:\\Users\\Vivek\\Desktop\\my certifications\\jpmorgan_virtual_internship_extracted.txt',
      'C:\\Users\\Vivek\\Desktop\\From my childhood, I always wanted.txt',
    ];
    for (const p of desktopPaths) {
      if (fs.existsSync(p)) {
        localContext += `\n\n--- LOCAL CANDIDATE FILE: ${path.basename(p)} ---\n` + fs.readFileSync(p, 'utf8');
      }
    }
  } catch (err) {
    console.warn("Local candidate files skipped", err);
  }

  return `CANDIDATE IDENTITY & PROFILE:\n${profileBlock}${styleDirective}\n\nKNOWLEDGE HUB DOCUMENTS & RESUMES:\n${documentBlocks}\n\n${savedResumeBlocks}${localContext}`.slice(0, maxChars);
}

export async function retrieveCandidateContext(supabase: any, userId: string, query: string, maxChars = 20_000) {
  try {
    const { embedText, toVectorLiteral } = await import("@/lib/embeddings.server");
    const vec = await embedText(query);
    const { data: chunks, error } = await supabase.rpc("match_user_chunks", {
      _user_id: userId,
      query_embedding: toVectorLiteral(vec) as unknown as string,
      match_count: 12,
    });
    if (!error && chunks?.length) {
      const retrieved = chunks.map((c: { content: string }, i: number) => `[Relevant Knowledge Chunk ${i + 1}] ${c.content}`).join("\n\n");
      const fallback = await loadCandidateText(supabase, userId, Math.max(5000, maxChars - retrieved.length));
      return `RELEVANT KNOWLEDGE BASE RETRIEVAL (TOP MATCHES):\n${retrieved}\n\nFULL CANDIDATE PROFILE AND KNOWLEDGE HUB:\n${fallback}`.slice(0, maxChars);
    }
  } catch (error) {
    console.error("retrieveCandidateContext fallback", error);
  }
  return loadCandidateText(supabase, userId, maxChars);
}
