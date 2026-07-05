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
  nodes_created: number;
  hadiths_created: number;
  duplicates_skipped: number;
  errors: { title?: string; hadith?: string; error: string }[];
};

export type ImportLogEntry = {
  id: string;
  filename: string;
  importedAt: string;
  book_title?: string;
  status: "success" | "error" | "partial";
  message?: string;
  stats?: ImportLogStats;
};

export type ImportCollectionResponse = {
  message: string;
  file?: string;
  stats?: ImportLogStats;
};

/** Returns a human-readable import statistics summary. */
export function formatImportStats(stats: ImportLogStats): string {
  const statsLines = [
    `Nodes created: ${stats.nodes_created}`,
    `Hadiths created: ${stats.hadiths_created}`,
    `Duplicates skipped: ${stats.duplicates_skipped}`,
  ];

  if (stats.errors.length > 0) {
    statsLines.push(`Errors: ${stats.errors.length}`);
    stats.errors.forEach((error) => {
      const context = error.title ?? error.hadith ?? "unknown";
      statsLines.push(`- ${context}: ${error.error}`);
    });
  }

  return statsLines.join("\n");
}

/** Normalize API stats (handles legacy field names). */
export function normalizeImportStats(
  raw?: Record<string, unknown>
): ImportLogStats {
  return {
    nodes_created: (raw?.nodes_created ?? raw?.nodes ?? raw?.kitabs_created ?? raw?.chapters_created ?? 0) as number,
    hadiths_created: (raw?.hadiths_created ?? raw?.hadiths ?? raw?.hadeeth_created ?? 0) as number,
    duplicates_skipped: (raw?.duplicates_skipped ?? 0) as number,
    errors: (Array.isArray(raw?.errors) ? raw.errors : []) as { title?: string; hadith?: string; error: string }[],
  };
}
