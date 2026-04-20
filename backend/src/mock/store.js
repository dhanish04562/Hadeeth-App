const createId = require("../utils/create-id");
const seed = require("./seed");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const state = {
  languages: clone(seed.languages),
  books: clone(seed.books),
  chapters: clone(seed.chapters),
  hadeeth: clone(seed.hadeeth)
};

function sortByNumber(items, key) {
  return [...items].sort((left, right) => {
    const leftValue = left[key] ?? Number.MAX_SAFE_INTEGER;
    const rightValue = right[key] ?? Number.MAX_SAFE_INTEGER;
    return leftValue - rightValue;
  });
}

function ensureTranslation(record, lang) {
  return (
    record.translations?.[lang] ||
    record.translations?.ar ||
    Object.values(record.translations || {})[0] ||
    {}
  );
}

function normalizeBook(record, lang) {
  const translation = ensureTranslation(record, lang);
  return {
    id: record.id,
    slug: record.slug,
    collectionNumber: record.collectionNumber,
    author: record.author,
    isPublished: record.isPublished,
    title: translation.title || "",
    summary: translation.summary || "",
    translations: record.translations
  };
}

function normalizeChapter(record, lang) {
  const translation = ensureTranslation(record, lang);
  return {
    id: record.id,
    bookId: record.bookId,
    parentId: record.parentId,
    chapterNumber: record.chapterNumber,
    isPublished: record.isPublished,
    title: translation.title || "",
    introduction: translation.introduction || "",
    translations: record.translations
  };
}

function normalizeHadeeth(record, lang) {
  const translation = ensureTranslation(record, lang);
  return {
    id: record.id,
    chapterId: record.chapterId,
    hadithNumber: record.hadithNumber,
    referenceNumber: record.referenceNumber,
    reportedBy: record.reportedBy,
    grade: record.grade,
    isPublished: record.isPublished,
    text: translation.text || "",
    notes: translation.notes || "",
    translations: record.translations
  };
}

function listLanguages() {
  return clone(state.languages);
}

function listPublicBooks(lang) {
  return state.books
    .filter((item) => item.isPublished)
    .map((item) => normalizeBook(item, lang))
    .sort((left, right) => Number(left.collectionNumber) - Number(right.collectionNumber));
}

function getPublicBook(id, lang) {
  const book = state.books.find((item) => item.id === id && item.isPublished);
  return book ? normalizeBook(book, lang) : null;
}

function listPublicChapters(bookId, lang) {
  return sortByNumber(
    state.chapters.filter((item) => item.bookId === bookId && item.isPublished),
    "chapterNumber"
  ).map((item) => normalizeChapter(item, lang));
}

function getPublicChapter(id, lang) {
  const chapter = state.chapters.find((item) => item.id === id && item.isPublished);
  return chapter ? normalizeChapter(chapter, lang) : null;
}

function listPublicHadeeth(chapterId, lang) {
  return sortByNumber(
    state.hadeeth.filter((item) => item.chapterId === chapterId && item.isPublished),
    "hadithNumber"
  ).map((item) => normalizeHadeeth(item, lang));
}

function getPublicHadeeth(id, lang) {
  const item = state.hadeeth.find((entry) => entry.id === id && entry.isPublished);
  return item ? normalizeHadeeth(item, lang) : null;
}

function adminList(resource, parentId) {
  const entries = clone(state[resource]);

  if (resource === "chapters" && parentId) {
    return entries.filter((item) => item.bookId === parentId);
  }

  if (resource === "hadeeth" && parentId) {
    return entries.filter((item) => item.chapterId === parentId);
  }

  return entries;
}

function adminGet(resource, id) {
  const key = resource === "languages" ? "code" : "id";
  return clone(state[resource].find((item) => item[key] === id) || null);
}

function prepareTranslations(translations, fieldNames) {
  const nextTranslations = {};

  for (const language of state.languages) {
    const current = translations?.[language.code] || {};
    nextTranslations[language.code] = fieldNames.reduce((accumulator, fieldName) => {
      accumulator[fieldName] = current[fieldName] || "";
      return accumulator;
    }, {});
  }

  return nextTranslations;
}

function createBook(payload) {
  const record = {
    id: createId(),
    slug: payload.slug,
    collectionNumber: payload.collectionNumber,
    author: payload.author,
    isPublished: Boolean(payload.isPublished),
    translations: prepareTranslations(payload.translations, ["title", "summary"])
  };

  state.books.push(record);
  return clone(record);
}

function updateBook(id, payload) {
  const record = state.books.find((item) => item.id === id);

  if (!record) {
    return null;
  }

  Object.assign(record, {
    slug: payload.slug,
    collectionNumber: payload.collectionNumber,
    author: payload.author,
    isPublished: Boolean(payload.isPublished),
    translations: prepareTranslations(payload.translations, ["title", "summary"])
  });

  return clone(record);
}

function deleteBook(id) {
  const chapterIds = state.chapters.filter((item) => item.bookId === id).map((item) => item.id);
  state.hadeeth = state.hadeeth.filter((item) => !chapterIds.includes(item.chapterId));
  state.chapters = state.chapters.filter((item) => item.bookId !== id);
  const previousLength = state.books.length;
  state.books = state.books.filter((item) => item.id !== id);
  return state.books.length !== previousLength;
}

function createChapter(payload) {
  const record = {
    id: createId(),
    bookId: payload.bookId,
    parentId: payload.parentId || null,
    chapterNumber: Number(payload.chapterNumber) || 1,
    isPublished: Boolean(payload.isPublished),
    translations: prepareTranslations(payload.translations, ["title", "introduction"])
  };

  state.chapters.push(record);
  return clone(record);
}

function updateChapter(id, payload) {
  const record = state.chapters.find((item) => item.id === id);

  if (!record) {
    return null;
  }

  Object.assign(record, {
    bookId: payload.bookId,
    parentId: payload.parentId || null,
    chapterNumber: Number(payload.chapterNumber) || 1,
    isPublished: Boolean(payload.isPublished),
    translations: prepareTranslations(payload.translations, ["title", "introduction"])
  });

  return clone(record);
}

function deleteChapter(id) {
  state.hadeeth = state.hadeeth.filter((item) => item.chapterId !== id);
  const previousLength = state.chapters.length;
  state.chapters = state.chapters.filter((item) => item.id !== id);
  return state.chapters.length !== previousLength;
}

function createHadeeth(payload) {
  const record = {
    id: createId(),
    chapterId: payload.chapterId,
    hadithNumber: Number(payload.hadithNumber) || 1,
    referenceNumber: payload.referenceNumber,
    reportedBy: payload.reportedBy,
    grade: payload.grade,
    isPublished: Boolean(payload.isPublished),
    translations: prepareTranslations(payload.translations, ["text", "notes"])
  };

  state.hadeeth.push(record);
  return clone(record);
}

function updateHadeeth(id, payload) {
  const record = state.hadeeth.find((item) => item.id === id);

  if (!record) {
    return null;
  }

  Object.assign(record, {
    chapterId: payload.chapterId,
    hadithNumber: Number(payload.hadithNumber) || 1,
    referenceNumber: payload.referenceNumber,
    reportedBy: payload.reportedBy,
    grade: payload.grade,
    isPublished: Boolean(payload.isPublished),
    translations: prepareTranslations(payload.translations, ["text", "notes"])
  });

  return clone(record);
}

function deleteHadeeth(id) {
  const previousLength = state.hadeeth.length;
  state.hadeeth = state.hadeeth.filter((item) => item.id !== id);
  return state.hadeeth.length !== previousLength;
}

function createLanguage(payload) {
  const record = {
    code: String(payload.code || "").trim().toLowerCase(),
    name: String(payload.name || "").trim(),
    nativeName: String(payload.nativeName || payload.name || "").trim(),
    direction: payload.direction === "rtl" ? "rtl" : "ltr"
  };

  state.languages.push(record);
  return clone(record);
}

function updateLanguage(code, payload) {
  const record = state.languages.find((item) => item.code === code);

  if (!record) {
    return null;
  }

  Object.assign(record, {
    name: String(payload.name || record.name || "").trim(),
    nativeName: String(payload.nativeName || payload.name || record.nativeName || "").trim(),
    direction:
      payload.direction === "rtl" ? "rtl" : payload.direction === "ltr" ? "ltr" : record.direction
  });

  return clone(record);
}

function deleteLanguage(code) {
  const previousLength = state.languages.length;
  state.languages = state.languages.filter((item) => item.code !== code);
  return state.languages.length !== previousLength;
}

module.exports = {
  listLanguages,
  listPublicBooks,
  getPublicBook,
  listPublicChapters,
  getPublicChapter,
  listPublicHadeeth,
  getPublicHadeeth,
  adminList,
  adminGet,
  createBook,
  updateBook,
  deleteBook,
  createChapter,
  updateChapter,
  deleteChapter,
  createHadeeth,
  updateHadeeth,
  deleteHadeeth,
  createLanguage,
  updateLanguage,
  deleteLanguage
};
