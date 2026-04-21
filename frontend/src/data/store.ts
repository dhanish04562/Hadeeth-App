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

export type Chapter = {
  id: string;
  bookId: string;
  parentId?: string | null;
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

type RawChapter = {
  id: string;
  bookId?: string;
  book_id?: string;
  parentId?: string | null;
  parent_id?: string | null;
  title?: string;
  isPublished?: boolean;
  is_published?: boolean;
  notes?: string;
  langCode?: string;
  lang_code?: string;
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
  chapters: RawChapter[];
  hadeeth: RawHadeeth[];
};

const initialState: DB = {
  books: [],
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

function normalize(raw: RawCache): DB {
  const chapterBookMap = new Map(
    raw.chapters.map((chapter) => [chapter.id, chapter.book_id || chapter.bookId || ""])
  );
  const chapterCounts = new Map<string, number>();
  const bookCounts = new Map<string, number>();

  for (const item of raw.hadeeth) {
    chapterCounts.set(item.chapterId, (chapterCounts.get(item.chapterId) || 0) + 1);
    const bookId = chapterBookMap.get(item.chapterId);
    if (bookId) {
      bookCounts.set(bookId, (bookCounts.get(bookId) || 0) + 1);
    }
  }

  const books = raw.books.map((book) => {
    return {
      id: book.id,
      title: String(book.title || "Untitled collection"),
      author: String(book.author || ""),
      notes: String(book.notes || ""),
      hadeethCount: bookCounts.get(book.id) || 0,
      era: "",
      langCode: String(book.lang_code || book.langCode || ""),
      isPublished: Boolean(book.is_published ?? book.isPublished),
    };
  });

  const chapters = raw.chapters.map((chapter) => {
    return {
      id: chapter.id,
      bookId: String(chapter.book_id || chapter.bookId || ""),
      parentId: chapter.parent_id ?? chapter.parentId ?? null,
      title: String(chapter.title || "Untitled chapter"),
      hadeethCount: chapterCounts.get(chapter.id) || 0,
      langCode: String(chapter.lang_code || chapter.langCode || ""),
      isPublished: Boolean(chapter.is_published ?? chapter.isPublished),
      notes: String(chapter.notes || ""),
    };
  });

  const hadeeth = raw.hadeeth.map((item) => {
    const text = String(item.hadeeth || "");
    return {
      id: item.id,
      bookId: chapterBookMap.get(item.chapter_id || item.chapterId || "") || "",
      chapterId: String(item.chapter_id || item.chapterId || ""),
      referenceNumber: Number(item.refernce_number || item.referenceNumber || 0),
      reportedBy: String(item.reported_by || item.reportedBy || ""),
      arabic: "",
      english: text,
      grade: "" as "" | "Sahih" | "Hasan" | "Da'if",
      notes: String(item.notes || ""),
      langCode: String(item.lang_code || item.langCode || ""),
      isPublished: Boolean(item.is_published ?? item.isPublished),
    };
  });

  const languages = raw.languages.map((language) => ({
    code: language.code,
    name: language.name || language.code,
  }));

  return {
    books,
    chapters,
    hadeeth,
    languages,
    isLoading: false,
    error: null,
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const API = import.meta.env.VITE_API_URL || "";
  if (!API) {
    throw new Error("Missing VITE_API_URL. Set it in your frontend environment.");
  }

  const response = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    ...init,
  });

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
  const [languages, books, chapters, hadeeth] = await Promise.all([
    apiFetch<RawLanguage[]>("/api/languages"),
    apiFetch<RawBook[]>("/api/admin/books"),
    apiFetch<RawChapter[]>("/api/admin/chapters"),
    apiFetch<RawHadeeth[]>("/api/admin/hadeeth"),
  ]);

  rawCache = { languages, books, chapters, hadeeth };
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
  getChaptersByBook: (bookId: string) => state.chapters.filter((chapter) => chapter.bookId === bookId),
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
  upsertChapter: async (chapter: Chapter) => {
    const payload = {
      title: chapter.title,
      book_id: chapter.bookId || null,
      parent_id: chapter.parentId || null,
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
