import { c as createServerRpc } from "./createServerRpc-DqGC0bE5.mjs";
import { a as createServerFn } from "./server-BD-sNUlq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-C6u9Brrq.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { g as objectType, z as booleanType, i as stringType, h as numberType, k as enumType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
const listDocuments_createServerFn_handler = createServerRpc({
  id: "7bbe916d0c0b14b33e289192f7ab12893c0b8286759f1948b274b5c959369258",
  name: "listDocuments",
  filename: "src/lib/documents.functions.ts"
}, (opts) => listDocuments.__executeServer(opts));
const listDocuments = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listDocuments_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase
  } = context;
  const {
    data,
    error
  } = await supabase.from("documents").select("id, kind, title, mime_type, size_bytes, is_primary, created_at").order("created_at", {
    ascending: false
  });
  if (error) throw new Error(error.message);
  return data ?? [];
});
const createDocument_createServerFn_handler = createServerRpc({
  id: "076f0d27c3d7b1fba7365afd1647231a0b13d6f0dd851a947be0c6d6c54fdc74",
  name: "createDocument",
  filename: "src/lib/documents.functions.ts"
}, (opts) => createDocument.__executeServer(opts));
const createDocument = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  title: stringType().min(1).max(200),
  kind: enumType(["resume", "knowledge_base", "cover_letter", "other"]),
  storage_path: stringType().optional(),
  mime_type: stringType().optional(),
  size_bytes: numberType().int().nonnegative().optional(),
  extracted_text: stringType().max(2e5).optional(),
  is_primary: booleanType().optional()
}).parse(input)).handler(createDocument_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  if (data.is_primary && data.kind === "resume") {
    await supabase.from("documents").update({
      is_primary: false
    }).eq("user_id", userId).eq("kind", "resume");
  }
  const {
    data: row,
    error
  } = await supabase.from("documents").insert({
    ...data,
    user_id: userId
  }).select().single();
  if (error) throw new Error(error.message);
  return row;
});
const deleteDocument_createServerFn_handler = createServerRpc({
  id: "3aa19b2f79082c5ff1f5628e9f17c9b708bb5ffaa61831d8c1a2062fe799a8a2",
  name: "deleteDocument",
  filename: "src/lib/documents.functions.ts"
}, (opts) => deleteDocument.__executeServer(opts));
const deleteDocument = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(deleteDocument_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const {
    error
  } = await supabase.from("documents").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const getDocument_createServerFn_handler = createServerRpc({
  id: "1697f68c362f0f7295091ed4dfd426e28abdf8975e9ae613689d562bea4cd6c8",
  name: "getDocument",
  filename: "src/lib/documents.functions.ts"
}, (opts) => getDocument.__executeServer(opts));
const getDocument = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(getDocument_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const {
    data: doc,
    error
  } = await supabase.from("documents").select("id, title, kind, mime_type, size_bytes, extracted_text, storage_path, created_at, is_primary").eq("id", data.id).single();
  if (error) throw new Error(error.message);
  let signedUrl = null;
  if (doc.storage_path) {
    const {
      data: sig
    } = await supabase.storage.from("jobpilot-documents").createSignedUrl(doc.storage_path, 60 * 10);
    signedUrl = sig?.signedUrl ?? null;
  }
  return {
    ...doc,
    signed_url: signedUrl
  };
});
const downloadDocument_createServerFn_handler = createServerRpc({
  id: "b747631a2578ddab2e0b51768b36dfc717c0fb527a2936a31201899f240b0ecb",
  name: "downloadDocument",
  filename: "src/lib/documents.functions.ts"
}, (opts) => downloadDocument.__executeServer(opts));
const downloadDocument = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
  id: stringType().uuid()
}).parse(input)).handler(downloadDocument_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const {
    data: doc,
    error
  } = await supabase.from("documents").select("id, title, kind, mime_type, storage_path").eq("id", data.id).single();
  if (error) throw new Error(error.message);
  if (!doc.storage_path) {
    throw new Error("No storage path found for this document");
  }
  const {
    data: fileData,
    error: downloadError
  } = await supabase.storage.from("jobpilot-documents").download(doc.storage_path);
  if (downloadError) throw downloadError;
  const mimeType = doc.mime_type || "application/octet-stream";
  const extension = mimeType.split("/")[1];
  const filename = `${doc.title}.${extension}`;
  return new Response(fileData, {
    headers: {
      "Content-Type": mimeType,
      "Content-Disposition": `attachment; filename="${filename}"`
    }
  });
});
export {
  createDocument_createServerFn_handler,
  deleteDocument_createServerFn_handler,
  downloadDocument_createServerFn_handler,
  getDocument_createServerFn_handler,
  listDocuments_createServerFn_handler
};
