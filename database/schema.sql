CREATE DATABASE abdullahpublication;

\c abdullahpublication;

CREATE TABLE IF NOT EXISTS languages (
  code VARCHAR(6) PRIMARY KEY,
  name VARCHAR(24) NOT NULL
);

CREATE TABLE IF NOT EXISTS books (
  id VARCHAR(24) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  author VARCHAR(255),
  notes TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  lang_code VARCHAR(6),
  CONSTRAINT fk_books_language
    FOREIGN KEY (lang_code)
    REFERENCES languages(code)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chapters (
  id VARCHAR(24) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  parent_id VARCHAR(24),
  book_id VARCHAR(24),
  is_published BOOLEAN DEFAULT FALSE,
  notes TEXT,
  lang_code VARCHAR(6),
  CONSTRAINT fk_chapters_parent
    FOREIGN KEY (parent_id)
    REFERENCES chapters(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_chapters_book
    FOREIGN KEY (book_id)
    REFERENCES books(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_chapters_language
    FOREIGN KEY (lang_code)
    REFERENCES languages(code)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS hadeeth (
  id VARCHAR(24) PRIMARY KEY,
  chapter_id VARCHAR(24),
  is_published BOOLEAN DEFAULT FALSE,
  notes TEXT,
  hadeeth TEXT,
  refernce_number INT,
  reported_by VARCHAR(255),
  lang_code VARCHAR(6),
  CONSTRAINT fk_hadeeth_chapter
    FOREIGN KEY (chapter_id)
    REFERENCES chapters(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hadeeth_language
    FOREIGN KEY (lang_code)
    REFERENCES languages(code)
    ON DELETE SET NULL
);
