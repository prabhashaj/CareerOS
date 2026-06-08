import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState } from "react";
import { Trash2, Plus, FileText, Eye, Download } from "lucide-react";
import { listDocuments, deleteDocument, getDocument, downloadDocument } from "@/lib/documents.functions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/documents")({
  head: () => ({ meta: [{ title: "Documents — CareerOS" }] }),
  component: DocumentsPage,
});

function DocumentsPage() {
  const qc = useQueryClient();
  const fn = useServerFn(listDocuments);
  const del = useServerFn(deleteDocument);
  const get = useServerFn(getDocument);
  const downloadDoc = useServerFn(downloadDocument);
  const { data, isLoading } = useQuery({ queryKey: ["documents"], queryFn: () => fn() });
  const [viewing, setViewing] = useState<Awaited<ReturnType<typeof get>> | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await del({ data: { id } });
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["documents"] });
  };

  const handleDownload = async (id: string) => {
    setLoadingId(id);
    try {
      const response = await downloadDoc({ data: { id } });
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = '';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match) {
          filename = match[1].replace(/['"]/g, '');
        }
      }
      if (!filename) {
        // Fallback: use title and mime_type from the viewing state (if available) or from the document?
        // We don't have the document here, so we'll use a generic name.
        // Alternatively, we could fetch the document again, but we already have it in the viewing state?
        // We are calling handleDownload only when viewing is set, so we can use viewing?.title and viewing?.mime_type
        // But note: the viewing state might not be set for this document? We are passing the id, and we have the viewing state only if we have viewed it.
        // To avoid complexity, we'll use a fallback of "document" plus extension from the mime_type we might get from the response?
        // Actually, we have the response, so we can get the mime_type from the response headers.
        const mimeType = response.headers.get('Content-Type') || 'application/octet-stream';
        const extension = mimeType.split('/')[1];
        filename = `document.${extension}`;
      }
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to download");
    } finally {
      setLoadingId(null);
    }
  };

  const handleView = async (id: string) => {
    setLoadingId(id);
    try {
      const doc = await get({ data: { id } });
      setViewing(doc);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumes and knowledge-base files.</p>
        </div>
        <Button asChild><Link to="/upload"><Plus className="mr-2 h-4 w-4" /> Add document</Link></Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data && data.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((d) => (
            <div key={d.id} className="flex items-start justify-between rounded-xl border border-border bg-card p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{d.title}</div>
                  <div className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">{d.kind.replace("_", " ")}</div>
                  {d.is_primary && <span className="mt-1 inline-block rounded bg-success/15 px-1.5 py-0.5 text-xs text-success">Primary</span>}
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => handleView(d.id)} disabled={loadingId === d.id}>
                  <Eye className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(d.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">No documents yet.</p>
          <Button asChild className="mt-4"><Link to="/upload">Upload a resume</Link></Button>
        </div>
      )}

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
          </DialogHeader>
          {viewing?.extracted_text ? (
            <div className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/30 p-4 text-sm">
              {viewing.extracted_text}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No extracted text stored for this document.
              {viewing?.signed_url ? " Use the download button to open the original file." : ""}
            </p>
          )}
          <DialogFooter>
            {viewing?.signed_url && (
              <Button variant="outline" onClick={() => handleDownload(viewing?.id)}>
                <Download className="mr-2 h-4 w-4" /> Open original
              </Button>
            )}
            <Button onClick={() => setViewing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
