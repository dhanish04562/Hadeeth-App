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
  nativeName?: string;
  direction?: "ltr" | "rtl";
};

type RawBook = {
  id: string;
  slug?: string;
  collectionNumber?: string;
  author?: string;
  isPublished?: boolean;
  translations?: Record<string, { title?: string; summary?: string }>;
};

type RawChapter = {
  id: string;
  bookId: string;
  parentId?: string | null;
  chapterNumber?: number;
  isPublished?: boolean;
  translations?: Record<string, { title?: string; introduction?: string }>;
};

type RawHadeeth = {
  id: string;
  chapterId: string;
  hadithNumber?: number;
  referenceNumber?: string | number;
  reportedBy?: string;
  grade?: "Sahih" | "Hasan" | "Da'if" | "";
  isPublished?: boolean;
  translations?: Record<string, { text?: string; notes?: string }>;
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

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function chooseTranslation<T extends object>(
  translations: Record<string, T> | undefined
) {
  if (!translations) {
    return { code: "ar", value: {} as T };
  }

  const entries = Object.entries(translations);
  const preferred =
    entries.find(([code]) => code === "en") ||
    entries.find(([code]) => code !== "ar") ||
    entries.find(([code]) => code === "ar") ||
    entries[0];

  return preferred
    ? { code: preferred[0], value: preferred[1] }
    : { code: "ar", value: {} as T };
}

function getArabicTranslation<T extends object>(
  translations: Record<string, T> | undefined
) {
  return translations?.ar || Object.values(translations || {})[0] || ({} as T);
}

function normalize(raw: RawCache): DB {
  const chapterBookMap = new Map(raw.chapters.map((chapter) => [chapter.id, chapter.bookId]));
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
    const translation = chooseTranslation(book.translations);
    return {
      id: book.id,
      title: String(translation.value.title || book.slug || "Untitled collection"),
      author: String(book.author || ""),
      notes: String(translation.value.summary || ""),
      hadeethCount: bookCounts.get(book.id) || 0,
      era: book.collectionNumber ? `Collection ${book.collectionNumber}` : "",
      langCode: translation.code,
      isPublished: Boolean(book.isPublished),
    };
  });

  const chapters = raw.chapters.map((chapter) => {
    const translation = chooseTranslation(chapter.translations);
    return {
      id: chapter.id,
      bookId: chapter.bookId,
      parentId: chapter.parentId ?? null,
      title: String(translation.value.title || "Untitled chapter"),
      hadeethCount: chapterCounts.get(chapter.id) || 0,
      langCode: translation.code,
      isPublished: Boolean(chapter.isPublished),
      notes: String(translation.value.introduction || ""),
    };
  });

  const hadeeth = raw.hadeeth.map((item) => {
    const translation = chooseTranslation(item.translations);
    const arabic = getArabicTranslation(item.translations);
    return {
      id: item.id,
      bookId: chapterBookMap.get(item.chapterId) || "",
      chapterId: item.chapterId,
      referenceNumber: Number(item.referenceNumber || item.hadithNumber || 0),
      reportedBy: String(item.reportedBy || ""),
      arabic: String(arabic.text || ""),
      english: String(translation.value.text || ""),
      grade: (item.grade || "") as "" | "Sahih" | "Hasan" | "Da'if",
      notes: String(translation.value.notes || ""),
      langCode: translation.code,
      isPublished: Boolean(item.isPublished),
    };
  });

  const languages = raw.languages.map((language) => ({
    code: language.code,
    name: language.nativeName || language.name || language.code,
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

function nextCollectionNumber() {
  const existing = rawCache.books
    .map((book) => Number(book.collectionNumber))
    .filter((value) => Number.isFinite(value));
  return String((Math.max(0, ...existing) || 0) + 1);
}

function nextChapterNumber(bookId: string) {
  const existing = rawCache.chapters
    .filter((chapter) => chapter.bookId === bookId)
    .map((chapter) => Number(chapter.chapterNumber))
    .filter((value) => Number.isFinite(value));
  return (Math.max(0, ...existing) || 0) + 1;
}

function nextHadithNumber(chapterId: string) {
  const existing = rawCache.hadeeth
    .filter((item) => item.chapterId === chapterId)
    .map((item) => Number(item.hadithNumber))
    .filter((value) => Number.isFinite(value));
  return (Math.max(0, ...existing) || 0) + 1;
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
    const existing = rawCache.books.find((item) => item.id === book.id);
    const langCode = book.langCode || (existing?.translations?.en ? "en" : "ta");
    const payload = {
      slug: existing?.slug || slugify(book.title),
      collectionNumber: existing?.collectionNumber || nextCollectionNumber(),
      author: book.author,
      isPublished: book.isPublished,
      translations: {
        ...(existing?.translations || {}),
        [langCode]: {
          title: book.title,
          summary: book.notes,
        },
      },
    };

    if (existing) {
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
    const existing = rawCache.chapters.find((item) => item.id === chapter.id);
    const payload = {
      bookId: chapter.bookId,
      parentId: existing?.parentId || null,
      chapterNumber: existing?.chapterNumber || nextChapterNumber(chapter.bookId),
      isPublished: chapter.isPublished,
      translations: {
        ...(existing?.translations || {}),
        [chapter.langCode || "ta"]: {
          title: chapter.title,
          introduction: chapter.notes || "",
        },
      },
    };

    if (existing) {
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
    const existing = rawCache.hadeeth.find((entry) => entry.id === item.id);
    const displayLang = item.langCode && item.langCode !== "ar" ? item.langCode : "ta";
    const payload = {
      chapterId: item.chapterId,
      hadithNumber: existing?.hadithNumber || item.referenceNumber || nextHadithNumber(item.chapterId),
      referenceNumber: String(item.referenceNumber || ""),
      reportedBy: item.reportedBy,
      grade: item.grade || "",
      isPublished: item.isPublished,
      translations: {
        ...(existing?.translations || {}),
        ar: {
          ...(existing?.translations?.ar || {}),
          text: item.arabic,
          notes: existing?.translations?.ar?.notes || "",
        },
        [displayLang]: {
          ...(existing?.translations?.[displayLang] || {}),
          text: item.english,
          notes: item.notes || "",
        },
      },
    };

    if (existing) {
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
