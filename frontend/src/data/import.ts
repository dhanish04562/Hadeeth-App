/**
 * JSON import format for Book → Kitab → Chapter → Hadith hierarchy.
 * POST /api/admin/import-json or /api/admin/import-collection
 */
export type ImportHadith = {
  reference_number: number;
  arabic?: string;
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

export type ImportCollectionStats = {
  book_id?: string;
  book_title?: string;
  kitabs_created: number;
  chapters_created: number;
  hadiths_created: number;
  duplicates_skipped: number;
};

export type ImportCollectionResponse = {
  message: string;
  file?: string;
  stats: ImportCollectionStats;
};
