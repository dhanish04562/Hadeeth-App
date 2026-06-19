import { ReactNode, useEffect, useSyncExternalStore } from "react";

export type Language = { code: string; name: string };

export type Book = {
  id: string;
  title: string;
  author: string;
  notes: string;
  hadeethCount: number;
  era: string;
  langCode: string;
  isPublished: boolean;
};

export type Kitab = {
  id: string;
  bookId: string;
  title: string;
  hadeethCount: number;
  langCode: string;
  isPublished: boolean;
  notes?: string;
};

export type Chapter = {
  id: string;
  bookId: string;
  kitabId: string;
  title: string;
  hadeethCount: number;
  langCode: string;
  isPublished: boolean;
  notes?: string;
};

export type Hadeeth = {
  id: string;
  bookId: string;
  chapterId: string;
  referenceNumber: number;
  reportedBy: string;
  arabic: string;
  english: string;
  grade?: "Sahih" | "Hasan" | "Da'if" | "";
  notes?: string;
  langCode: string;
  isPublished: boolean;
};

type DB = {
  books: Book[];
  kitabs: Kitab[];
  chapters: Chapter[];
  hadeeth: Hadeeth[];
  languages: Language[];
  isLoading: boolean;
  error: string | null;
};

type RawLanguage = {
  code: string;
  name?: string;
};

type RawBook = {
  id: string;
  title?: string;
  author?: string;
  notes?: string;
  isPublished?: boolean;
  is_published?: boolean;
  langCode?: string;
  lang_code?: string;
};

type RawKitab = {
  id: string;
  bookId?: string;
  book_id?: string;
  title?: string;
  isPublished?: boolean;
  is_published?: boolean;
  notes?: string;
  langCode?: string;
  lang_code?: string;
  sort_order?: number;
};

type RawChapter = {
  id: string;
  bookId?: string;
  book_id?: string;
  kitabId?: string;
  kitab_id?: string;
  title?: string;
  isPublished?: boolean;
  is_published?: boolean;
  notes?: string;
  langCode?: string;
  lang_code?: string;
  sort_order?: number;
};

type RawHadeeth = {
  id: string;
  chapterId?: string;
  chapter_id?: string;
  hadeeth?: string;
  referenceNumber?: string | number;
  refernce_number?: string | number;
  reportedBy?: string;
  reported_by?: string;
  isPublished?: boolean;
  is_published?: boolean;
  notes?: string;
  langCode?: string;
  lang_code?: string;
};

type RawCache = {
  languages: RawLanguage[];
  books: RawBook[];
  kitabs: RawKitab[];
  chapters: RawChapter[];
  hadeeth: RawHadeeth[];
};

const initialState: DB = {
  books: [],
  kitabs: [],
  chapters: [],
  hadeeth: [],
  languages: [],
  isLoading: true,
  error: null,
};

let state: DB = initialState;
let rawCache: RawCache = {
  languages: [],
  books: [],
  kitabs: [],
  chapters: [],
  hadeeth: [],
};
let loadPromise: Promise<void> | null = null;

const listeners = new Set<() => void>();

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function emit() {
  listeners.forEach((listener) => listener());
}

function setState(updater: (current: DB) => DB) {
  state = updater(state);
  emit();
}

function getSnapshot() {
  return state;
}

function orderFromNotes(notes?: string, key = "kitab_number") {
  const match = String(notes || "").match(new RegExp(`${key}:(\\d+)`));
  return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
}

function normalize(raw: RawCache): DB {
  const chapterBookMap = new Map(
    raw.chapters.map((chapter) => [chapter.id, chapter.book_id || chapter.bookId || ""])
  );
  const chapterKitabMap = new Map(
    raw.chapters.map((chapter) => [chapter.id, chapter.kitab_id || chapter.kitabId || ""])
  );
  const chapterCounts = new Map<string, number>();
  const kitabCounts = new Map<string, number>();
  const bookCounts = new Map<string, number>();

  for (const item of raw.hadeeth) {
    const chapterId = item.chapter_id || item.chapterId || "";
    chapterCounts.set(chapterId, (chapterCounts.get(chapterId) || 0) + 1);
    const kitabId = chapterKitabMap.get(chapterId);
    if (kitabId) {
      kitabCounts.set(kitabId, (kitabCounts.get(kitabId) || 0) + 1);
    }
    const bookId = chapterBookMap.get(chapterId);
    if (bookId) {
      bookCounts.set(bookId, (bookCounts.get(bookId) || 0) + 1);
    }
  }

  const books = raw.books.map((book) => ({
    id: book.id,
    title: String(book.title || "Untitled collection"),
    author: String(book.author || ""),
    notes: String(book.notes || ""),
    hadeethCount: bookCounts.get(book.id) || 0,
    era: "",
    langCode: String(book.lang_code || book.langCode || ""),
    isPublished: Boolean(book.is_published ?? book.isPublished),
  }));

  const kitabs = raw.kitabs
    .map((kitab) => ({
      id: kitab.id,
      bookId: String(kitab.book_id || kitab.bookId || ""),
      title: String(kitab.title || "Untitled kitab"),
      hadeethCount: kitabCounts.get(kitab.id) || 0,
      langCode: String(kitab.lang_code || kitab.langCode || ""),
      isPublished: Boolean(kitab.is_published ?? kitab.isPublished),
      notes: String(kitab.notes || ""),
    }))
    .sort((a, b) => {
      const orderCompare =
        orderFromNotes(a.notes, "kitab_number") - orderFromNotes(b.notes, "kitab_number");
      if (orderCompare) return orderCompare;
      return a.title.localeCompare(b.title);
    });

  const chapters = raw.chapters
    .map((chapter) => ({
      id: chapter.id,
      bookId: String(chapter.book_id || chapter.bookId || ""),
      kitabId: String(chapter.kitab_id || chapter.kitabId || ""),
      title: String(chapter.title || "Untitled chapter"),
      hadeethCount: chapterCounts.get(chapter.id) || 0,
      langCode: String(chapter.lang_code || chapter.langCode || ""),
      isPublished: Boolean(chapter.is_published ?? chapter.isPublished),
      notes: String(chapter.notes || ""),
    }))
    .sort((a, b) => {
      const kitabCompare = a.kitabId.localeCompare(b.kitabId);
      if (kitabCompare) return kitabCompare;
      const orderCompare =
        orderFromNotes(a.notes, "chapter_number") - orderFromNotes(b.notes, "chapter_number");
      if (orderCompare) return orderCompare;
      return a.title.localeCompare(b.title);
    });

  const hadeeth = raw.hadeeth.map((item) => {
    const text = String(item.hadeeth || "");
    const langCode = String(item.lang_code || item.langCode || "");
    const isArabic = langCode.toLowerCase() === "ar";
    return {
      id: item.id,
      bookId: chapterBookMap.get(item.chapter_id || item.chapterId || "") || "",
      chapterId: String(item.chapter_id || item.chapterId || ""),
      referenceNumber: Number(item.refernce_number || item.referenceNumber || 0),
      reportedBy: String(item.reported_by || item.reportedBy || ""),
      arabic: isArabic ? text : "",
      english: isArabic ? "" : text,
      grade: "" as "" | "Sahih" | "Hasan" | "Da'if",
      notes: String(item.notes || ""),
      langCode,
      isPublished: Boolean(item.is_published ?? item.isPublished),
    };
  });

  const languages = raw.languages.map((language) => ({
    code: language.code,
    name: language.name || language.code,
  }));

  return {
    books,
    kitabs,
    chapters,
    hadeeth,
    languages,
    isLoading: false,
    error: null,
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const API = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const url = `${API}${path}`;

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {}),
      },
      ...init,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(message || `Network error when fetching ${url}`);
  }

  if (!response.ok) {
    let message = "Request failed";
    try {
      const body = await response.json();
      message = body.message || message;
    } catch {
      message = response.statusText || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function loadAll() {
  const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith("/admin");

  const booksPath = isAdmin ? "/api/admin/books" : "/api/public/books";
  const kitabsPath = isAdmin ? "/api/admin/kitabs" : "/api/public/kitabs";
  const chaptersPath = isAdmin ? "/api/admin/chapters" : "/api/public/chapters";
  const hadeethPath = isAdmin ? "/api/admin/hadeeth" : "/api/public/hadeeth";

  const [languages, books, kitabs, chapters, hadeeth] = await Promise.all([
    apiFetch<RawLanguage[]>("/api/languages"),
    apiFetch<RawBook[]>(booksPath),
    apiFetch<RawKitab[]>(kitabsPath),
    apiFetch<RawChapter[]>(chaptersPath),
    apiFetch<RawHadeeth[]>(hadeethPath),
  ]);

  rawCache = { languages, books, kitabs, chapters, hadeeth };
  setState(() => normalize(rawCache));
}

function initializeDB() {
  if (!loadPromise) {
    setState((current) => ({ ...current, isLoading: true, error: null }));
    loadPromise = loadAll()
      .catch((error: Error) => {
        setState((current) => ({
          ...current,
          isLoading: false,
          error: error.message || "Unable to load data from the backend.",
        }));
      })
      .finally(() => {
        loadPromise = null;
      });
  }

  return loadPromise;
}

export function DBProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void initializeDB();
  }, []);

  return children;
}

export function useDB(): DB {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export const db = {
  getAll: () => state,
  getBook: (id: string) => state.books.find((book) => book.id === id),
  getKitabsByBook: (bookId: string) => state.kitabs.filter((kitab) => kitab.bookId === bookId),
  getKitab: (id: string) => state.kitabs.find((kitab) => kitab.id === id),
  getChaptersByBook: (bookId: string) => state.chapters.filter((chapter) => chapter.bookId === bookId),
  getChaptersByKitab: (kitabId: string) => state.chapters.filter((chapter) => chapter.kitabId === kitabId),
  getHadeethByBook: (bookId: string) => state.hadeeth.filter((item) => item.bookId === bookId),
  getHadeethByChapter: (chapterId: string) => state.hadeeth.filter((item) => item.chapterId === chapterId),
  getHadeethById: (id: string) => state.hadeeth.find((item) => item.id === id),
  getChapter: (id: string) => state.chapters.find((chapter) => chapter.id === id),
  refresh: () => initializeDB(),
  upsertBook: async (book: Book) => {
    const payload = {
      title: book.title,
      author: book.author,
      notes: book.notes,
      is_published: book.isPublished,
      lang_code: book.langCode || null,
    };

    if (book.id && rawCache.books.some((item) => item.id === book.id)) {
      await apiFetch(`/api/admin/books/${book.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/admin/books", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await loadAll();
  },
  deleteBook: async (id: string) => {
    await apiFetch(`/api/admin/books/${id}`, { method: "DELETE" });
    await loadAll();
  },
  upsertKitab: async (kitab: Kitab) => {
    const payload = {
      title: kitab.title,
      book_id: kitab.bookId || null,
      is_published: kitab.isPublished,
      notes: kitab.notes || "",
      lang_code: kitab.langCode || null,
    };

    if (kitab.id && rawCache.kitabs.some((item) => item.id === kitab.id)) {
      await apiFetch(`/api/admin/kitabs/${kitab.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/admin/kitabs", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await loadAll();
  },
  deleteKitab: async (id: string) => {
    await apiFetch(`/api/admin/kitabs/${id}`, { method: "DELETE" });
    await loadAll();
  },
  upsertChapter: async (chapter: Chapter) => {
    const payload = {
      title: chapter.title,
      book_id: chapter.bookId || null,
      kitab_id: chapter.kitabId || null,
      is_published: chapter.isPublished,
      notes: chapter.notes || "",
      lang_code: chapter.langCode || null,
    };

    if (chapter.id && rawCache.chapters.some((item) => item.id === chapter.id)) {
      await apiFetch(`/api/admin/chapters/${chapter.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/admin/chapters", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await loadAll();
  },
  deleteChapter: async (id: string) => {
    await apiFetch(`/api/admin/chapters/${id}`, { method: "DELETE" });
    await loadAll();
  },
  upsertHadeeth: async (item: Hadeeth) => {
    const payload = {
      chapter_id: item.chapterId || null,
      hadeeth: item.english || item.arabic || "",
      refernce_number: item.referenceNumber || 0,
      reported_by: item.reportedBy,
      is_published: item.isPublished,
      notes: item.notes || "",
      lang_code: item.langCode || null,
    };

    if (item.id && rawCache.hadeeth.some((entry) => entry.id === item.id)) {
      await apiFetch(`/api/admin/hadeeth/${item.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/admin/hadeeth", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await loadAll();
  },
  deleteHadeeth: async (id: string) => {
    await apiFetch(`/api/admin/hadeeth/${id}`, { method: "DELETE" });
    await loadAll();
  },
  upsertLanguage: async (language: Language) => {
    const payload = {
      code: language.code.trim().toLowerCase(),
      name: language.name.trim(),
      nativeName: language.name.trim(),
      direction: "ltr",
    };
    const existing = rawCache.languages.find((item) => item.code === payload.code);

    if (existing) {
      await apiFetch(`/api/admin/languages/${payload.code}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await apiFetch("/api/admin/languages", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    await loadAll();
  },
  deleteLanguage: async (code: string) => {
    await apiFetch(`/api/admin/languages/${code}`, { method: "DELETE" });
    await loadAll();
  },
};
