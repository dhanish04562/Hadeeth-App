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

CREATE TABLE IF NOT EXISTS kitabs (
  id VARCHAR(24) PRIMARY KEY,
  book_id VARCHAR(24) NOT NULL,
  title VARCHAR(255) NOT NULL,
  notes TEXT,
  lang_code VARCHAR(20),
  is_published BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_kitabs_book
    FOREIGN KEY (book_id)
    REFERENCES books(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chapters (
  id VARCHAR(24) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  kitab_id VARCHAR(24),
  book_id VARCHAR(24),
  is_published BOOLEAN DEFAULT FALSE,
  notes TEXT,
  lang_code VARCHAR(6),
  CONSTRAINT fk_chapters_kitab
    FOREIGN KEY (kitab_id)
    REFERENCES kitabs(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_chapters_book
    FOREIGN KEY (book_id)
    REFERENCES books(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_chapters_language
    FOREIGN KEY (lang_code)
    REFERENCES languages(code)
    ON DELETE SET NULL
);

CREATE EXTENSION IF NOT EXISTS ltree;

CREATE TABLE IF NOT EXISTS nodes (
  id VARCHAR(24) PRIMARY KEY,
  parent_id VARCHAR(24) REFERENCES nodes(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL DEFAULT 'node',
  title TEXT NOT NULL DEFAULT '',
  path LTREE,
  is_published BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nodes_parent_id ON nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_nodes_path ON nodes USING GIST (path);
CREATE INDEX IF NOT EXISTS idx_nodes_type ON nodes(type);

CREATE TABLE IF NOT EXISTS hadeeth (
  id VARCHAR(24) PRIMARY KEY,
  chapter_id VARCHAR(24),
  node_id VARCHAR(24),
  reference_number INT,
  arabic TEXT,
  tamil TEXT,
  english TEXT,
  reported_by VARCHAR(255),
  grade VARCHAR(64),
  is_published BOOLEAN DEFAULT TRUE,
  CONSTRAINT fk_hadeeth_chapter
    FOREIGN KEY (chapter_id)
    REFERENCES chapters(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hadeeth_node
    FOREIGN KEY (node_id)
    REFERENCES nodes(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_hadeeth_node_id ON hadeeth(node_id);
CREATE INDEX IF NOT EXISTS idx_kitabs_book_id ON kitabs(book_id);
CREATE INDEX IF NOT EXISTS idx_chapters_kitab_id ON chapters(kitab_id);

CREATE UNIQUE INDEX IF NOT EXISTS ux_hadeeth_chapter_reference
  ON hadeeth(chapter_id, reference_number)
  WHERE chapter_id IS NOT NULL AND reference_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_kitabs_book_title
  ON kitabs(book_id, title);

CREATE UNIQUE INDEX IF NOT EXISTS ux_chapters_kitab_title
  ON chapters(kitab_id, title);
