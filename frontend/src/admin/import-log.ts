import type { ImportLogEntry, ImportLogStats } from "@/data/import";

const STORAGE_KEY = "nuur-import-log";
const MAX_ENTRIES = 30;

function readEntries(): ImportLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ImportLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeEntries(entries: ImportLogEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

export function getImportLog(): ImportLogEntry[] {
  return readEntries();
}

export function appendImportLog(entry: Omit<ImportLogEntry, "id" | "importedAt">) {
  const next: ImportLogEntry = {
    ...entry,
    id: crypto.randomUUID(),
    importedAt: new Date().toISOString(),
  };
  writeEntries([next, ...readEntries()]);
  return next;
}

export function clearImportLog() {
  localStorage.removeItem(STORAGE_KEY);
}

export function summarizeImportStats(stats: ImportLogStats): string {
  const parts = [
    `${stats.nodes_created} node(s)`,
    `${stats.hadiths_created} hadith(s)`,
    stats.duplicates_skipped
      ? `${stats.duplicates_skipped} duplicate(s) skipped`
      : null,
  ];
  if (stats.errors?.length) {
    parts.push(`${stats.errors.length} error(s)`);
  }
  return parts.filter(Boolean).join(" · ");
}
