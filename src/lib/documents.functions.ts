import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listDocuments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data, error } = await supabase
      .from("documents")
      .select("id, kind, title, mime_type, size_bytes, is_primary, created_at")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      title: z.string().min(1).max(200),
      kind: z.enum(["resume", "knowledge_base", "cover_letter", "other"]),
      storage_path: z.string().optional(),
      mime_type: z.string().optional(),
      size_bytes: z.number().int().nonnegative().optional(),
      extracted_text: z.string().max(200_000).optional(),
      is_primary: z.boolean().optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.is_primary && data.kind === "resume") {
      await supabase.from("documents").update({ is_primary: false }).eq("user_id", userId).eq("kind", "resume");
    }
    const { data: row, error } = await supabase
      .from("documents")
      .insert({ ...data, user_id: userId })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("documents").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, title, kind, mime_type, size_bytes, extracted_text, storage_path, created_at, is_primary")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    let signedUrl: string | null = null;
    if (doc.storage_path) {
      const { data: sig } = await supabase.storage
        .from("jobpilot-documents")
        .createSignedUrl(doc.storage_path, 60 * 10);
      signedUrl = sig?.signedUrl ?? null;
    }
    return { ...doc, signed_url: signedUrl };
  });

export const downloadDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: doc, error } = await supabase
      .from("documents")
      .select("id, title, kind, mime_type, storage_path")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    if (!doc.storage_path) {
      throw new Error("No storage path found for this document");
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from("jobpilot-documents")
      .download(doc.storage_path);

    if (downloadError) throw downloadError;

    // Determine the file extension from the mime_type, with fallback
    const mimeType = doc.mime_type || 'application/octet-stream';
    const extension = mimeType.split('/')[1]; // e.g., 'pdf' from 'application/pdf'
    // If the mime_type is not recognized, we can use 'bin' as fallback.
    const filename = `${doc.title}.${extension}`;

    return new Response(fileData, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  });

