async function loadCandidateText(supabase, userId, maxChars = 14e3) {
  const [{ data: profile }, { data: docs }] = await Promise.all([
    supabase.from("profiles").select("full_name, headline, location, target_roles, target_locations").eq("id", userId).maybeSingle(),
    supabase.from("documents").select("title, kind, extracted_text, is_primary, created_at").eq("user_id", userId).not("extracted_text", "is", null).order("is_primary", { ascending: false }).order("created_at", { ascending: false })
  ]);
  const profileBlock = profile ? [
    `Name: ${profile.full_name ?? ""}`,
    `Headline: ${profile.headline ?? ""}`,
    `Location: ${profile.location ?? ""}`,
    `Target roles: ${(profile.target_roles ?? []).join(", ")}`,
    `Target locations: ${(profile.target_locations ?? []).join(", ")}`
  ].join("\n") : "";
  const documentBlocks = (docs ?? []).filter((doc) => doc.extracted_text?.trim()).map((doc) => `DOCUMENT: ${doc.title ?? doc.kind ?? "candidate context"}
${doc.extracted_text.trim()}`).join("\n\n---\n\n");
  return `PROFILE:
${profileBlock}

DOCUMENTS:
${documentBlocks}`.slice(0, maxChars);
}
async function retrieveCandidateContext(supabase, userId, query, maxChars = 14e3) {
  try {
    const { embedText, toVectorLiteral } = await import("./embeddings.server-CIj1-C-K.mjs");
    const vec = await embedText(query);
    const { data: chunks, error } = await supabase.rpc("match_user_chunks", {
      _user_id: userId,
      query_embedding: toVectorLiteral(vec),
      match_count: 10
    });
    if (!error && chunks?.length) {
      const retrieved = chunks.map((c, i) => `[chunk ${i + 1}] ${c.content}`).join("\n\n");
      const fallback = await loadCandidateText(supabase, userId, Math.max(3e3, maxChars - retrieved.length));
      return `RETRIEVED CONTEXT:
${retrieved}

CANDIDATE PROFILE AND DOCUMENTS:
${fallback}`.slice(0, maxChars);
    }
  } catch (error) {
    console.error("retrieveCandidateContext fallback", error);
  }
  return loadCandidateText(supabase, userId, maxChars);
}
export {
  loadCandidateText,
  retrieveCandidateContext
};
