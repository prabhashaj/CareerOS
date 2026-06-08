
CREATE OR REPLACE FUNCTION public.match_user_chunks(
  _user_id uuid,
  query_embedding vector(1536),
  match_count int DEFAULT 8
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
LANGUAGE sql STABLE SECURITY INVOKER
SET search_path = public
AS $$
  SELECT c.id, c.document_id, c.content, c.metadata,
         1 - (c.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks c
  WHERE c.user_id = _user_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
$$;
