
-- Enable pgvector for semantic retrieval over user documents
CREATE EXTENSION IF NOT EXISTS vector;

-- Chunked, embedded pieces of user documents (resume, KB, cover letters)
CREATE TABLE public.document_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index int NOT NULL,
  content text NOT NULL,
  embedding vector(1536),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.document_chunks TO authenticated;
GRANT ALL ON public.document_chunks TO service_role;

ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own chunks"
ON public.document_chunks
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX document_chunks_user_idx ON public.document_chunks(user_id);
CREATE INDEX document_chunks_document_idx ON public.document_chunks(document_id);
CREATE INDEX document_chunks_embedding_idx
  ON public.document_chunks USING hnsw (embedding vector_cosine_ops);

-- Job embeddings for hybrid retrieval / similarity
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS embedding vector(1536);
CREATE INDEX IF NOT EXISTS jobs_embedding_idx
  ON public.jobs USING hnsw (embedding vector_cosine_ops);

-- Similarity search across the current user's document chunks
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
LANGUAGE sql STABLE SECURITY DEFINER
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
