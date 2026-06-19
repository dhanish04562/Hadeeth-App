import { useEffect, useState } from "react";
import type { ImportLogEntry } from "@/data/import";
import { formatImportStats } from "@/data/import";
import { clearImportLog, getImportLog } from "./import-log";
import { Button } from "@/components/ui/button";
import { CheckCircle2, FileJson, Trash2, XCircle } from "lucide-react";

type ImportLogProps = {
  /** Bump when a new import completes to reload from storage. */
  refreshKey?: number;
};

export function ImportLog({ refreshKey = 0 }: ImportLogProps) {
  const [entries, setEntries] = useState<ImportLogEntry[]>(() => getImportLog());

  useEffect(() => {
    setEntries(getImportLog());
  }, [refreshKey]);

  const latest = entries.find((entry) => entry.status === "success" && entry.stats);

  const handleClear = () => {
    clearImportLog();
    setEntries([]);
  };

  if (entries.length === 0) {
    return (
      <div className="mt-12 rounded-2xl border border-dashed border-border bg-card/50 p-6 md:p-8">
        <div className="flex items-center gap-3">
          <FileJson className="h-5 w-5 text-muted-foreground" />
          <div>
            <h2 className="font-serif text-2xl text-foreground">Import log</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Import a JSON file to see kitab, chapter, and hadith counts here before
              running large collections.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Import log</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the last import before continuing with larger files.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleClear}>
          <Trash2 className="mr-1.5 h-4 w-4" />
          Clear log
        </Button>
      </div>

      {latest?.stats && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 md:p-8">
          <p className="text-xs uppercase tracking-[0.2em] text-primary/80">Latest import</p>
          <p className="mt-2 text-sm text-foreground/80">
            <span className="font-medium">{latest.filename}</span>
            {latest.book_title ? (
              <span className="text-muted-foreground"> · {latest.book_title}</span>
            ) : null}
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-card p-4 font-mono text-sm leading-relaxed text-foreground">
            {formatImportStats(latest.stats)}
          </pre>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-muted/40 px-5 py-3 text-xs uppercase tracking-wider text-muted-foreground">
          History
        </div>
        <ul className="divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {entry.status === "success" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-destructive" />
                    )}
                    <p className="truncate font-medium text-foreground">{entry.filename}</p>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(entry.importedAt).toLocaleString()}
                    {entry.book_title ? ` · ${entry.book_title}` : ""}
                  </p>
                  {entry.status === "error" && entry.message && (
                    <p className="mt-2 text-sm text-destructive">{entry.message}</p>
                  )}
                </div>
                {entry.stats && (
                  <pre className="max-w-full overflow-x-auto rounded-lg bg-muted/50 px-3 py-2 font-mono text-xs text-foreground">
                    {formatImportStats(entry.stats)}
                  </pre>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
