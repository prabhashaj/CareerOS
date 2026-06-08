type CandidateDoc = {
  title: string | null;
  kind: string | null;
  extracted_text: string | null;
  is_primary: boolean | null;
};

export async function loadCandidateText(supabase: any, userId: string, maxChars = 14_000) {
  const [{ data: profile }, { data: docs }] = await Promise.all([
    supabase.from("profiles").select("full_name, headline, location, target_roles, target_locations").eq("id", userId).maybeSingle(),
    supabase
      .from("documents")
      .select("title, kind, extracted_text, is_primary, created_at")
      .eq("user_id", userId)
      .not("extracted_text", "is", null)
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const profileBlock = profile
    ? [
        `Name: ${profile.full_name ?? ""}`,
        `Headline: ${profile.headline ?? ""}`,
        `Location: ${profile.location ?? ""}`,
        `Target roles: ${((profile.target_roles ?? []) as string[]).join(", ")}`,
        `Target locations: ${((profile.target_locations ?? []) as string[]).join(", ")}`,
      ].join("\n")
    : "";

  const documentBlocks = ((docs ?? []) as CandidateDoc[])
    .filter((doc) => doc.extracted_text?.trim())
    .map((doc) => `DOCUMENT: ${doc.title ?? doc.kind ?? "candidate context"}\n${doc.extracted_text!.trim()}`)
    .join("\n\n---\n\n");

  return `PROFILE:\n${profileBlock}\n\nDOCUMENTS:\n${documentBlocks}`.slice(0, maxChars);
}

export async function retrieveCandidateContext(supabase: any, userId: string, query: string, maxChars = 14_000) {
  try {
    const { embedText, toVectorLiteral } = await import("@/lib/embeddings.server");
    const vec = await embedText(query);
    const { data: chunks, error } = await supabase.rpc("match_user_chunks", {
      _user_id: userId,
      query_embedding: toVectorLiteral(vec) as unknown as string,
      match_count: 10,
    });
    if (!error && chunks?.length) {
      const retrieved = chunks.map((c: { content: string }, i: number) => `[chunk ${i + 1}] ${c.content}`).join("\n\n");
      const fallback = await loadCandidateText(supabase, userId, Math.max(3000, maxChars - retrieved.length));
      return `RETRIEVED CONTEXT:\n${retrieved}\n\nCANDIDATE PROFILE AND DOCUMENTS:\n${fallback}`.slice(0, maxChars);
    }
  } catch (error) {
    console.error("retrieveCandidateContext fallback", error);
  }
  return loadCandidateText(supabase, userId, maxChars);
}
