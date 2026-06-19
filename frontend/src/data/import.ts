/**
 * JSON import format for Book → Kitab → Chapter → Hadith hierarchy.
 * POST /api/admin/import-json or /api/admin/import-collection
 */
export type ImportHadith = {
  reference_number: number;
  arabic?: string;
  tamil?: string;
  english?: string;
  reported_by?: string;
  grade?: string;
};

export type ImportChapter = {
  title: string;
  lang_code?: string;
  hadiths?: ImportHadith[];
};

export type ImportKitab = {
  title: string;
  lang_code?: string;
  chapters?: ImportChapter[];
};

export type ImportCollectionPayload = {
  book_title: string;
  kitabs: ImportKitab[];
};

/** Canonical import statistics returned after each import. */
export type ImportLogStats = {
  kitabs_created: number;
  chapters_created: number;
  hadeeth_created: number;
  duplicates_skipped: number;
};

export type ImportCollectionStats = ImportLogStats & {
  book_id?: string;
  book_title?: string;
};

export type ImportLogEntry = {
  id: string;
  filename: string;
  importedAt: string;
  book_title?: string;
  status: "success" | "error";
  message?: string;
  stats?: ImportLogStats;
};

export type ImportCollectionResponse = {
  message: string;
  file?: string;
  stats?: ImportCollectionStats;
};

/** Normalize API stats (handles legacy field names). */
export function normalizeImportStats(
  raw?: Partial<ImportCollectionStats> & { hadiths_created?: number }
): ImportLogStats {
  return {
    kitabs_created: raw?.kitabs_created ?? 0,
    chapters_created: raw?.chapters_created ?? 0,
    hadeeth_created: raw?.hadeeth_created ?? raw?.hadiths_created ?? 0,
    duplicates_skipped: raw?.duplicates_skipped ?? 0,
  };
}

export function formatImportStats(stats: ImportLogStats): string {
  return JSON.stringify(stats, null, 2);
}
