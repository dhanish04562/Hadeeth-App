require("dotenv").config();
const fs = require("fs");
const path = require("path");
const pool = require("../src/db/pool");

const BOOK_ID = "book-malim-sunnah";
const BOOK_TITLE_AR = "معالم السنة النبوية";
const BOOK_TITLE_TA = "மஆலிமுஸ் ஸுன்னாவின் நபவிய்யா";

function text(value, fallback = "") {
  return typeof value === "string" ? value.trim() : String(value ?? fallback).trim();
}

async function setupSchema(client) {
  console.log("📦  Setting up database schema...");

  // Drop in reverse dependency order
  await client.query("DROP TABLE IF EXISTS hadeeth CASCADE");
  await client.query("DROP TABLE IF EXISTS chapters CASCADE");
  await client.query("DROP TABLE IF EXISTS kitabs CASCADE");
  await client.query("DROP TABLE IF EXISTS books CASCADE");
  await client.query("DROP TABLE IF EXISTS languages CASCADE");

  // Create tables with proper constraints
  await client.query(`
    CREATE TABLE languages (
      code VARCHAR(6) PRIMARY KEY,
      name VARCHAR(24) NOT NULL
    )
  `);

  await client.query(`
    CREATE TABLE books (
      id VARCHAR(24) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      author VARCHAR(255),
      notes TEXT,
      is_published BOOLEAN DEFAULT FALSE,
      lang_code VARCHAR(6) REFERENCES languages(code) ON DELETE SET NULL
    )
  `);

  await client.query(`
    CREATE TABLE kitabs (
      id VARCHAR(24) PRIMARY KEY,
      book_id VARCHAR(24) NOT NULL REFERENCES books(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      notes TEXT,
      lang_code VARCHAR(20),
      is_published BOOLEAN DEFAULT TRUE
    )
  `);

  await client.query(`
    CREATE TABLE chapters (
      id VARCHAR(24) PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      kitab_id VARCHAR(24) REFERENCES kitabs(id) ON DELETE CASCADE,
      book_id VARCHAR(24) REFERENCES books(id) ON DELETE CASCADE,
      is_published BOOLEAN DEFAULT FALSE,
      notes TEXT,
      lang_code VARCHAR(6) REFERENCES languages(code) ON DELETE SET NULL
    )
  `);

  await client.query(`
    CREATE TABLE hadeeth (
      id VARCHAR(24) PRIMARY KEY,
      chapter_id VARCHAR(24) REFERENCES chapters(id) ON DELETE CASCADE,
      reference_number INT,
      arabic TEXT,
      tamil TEXT,
      english TEXT,
      reported_by TEXT,
      grade VARCHAR(64),
      is_published BOOLEAN DEFAULT TRUE
    )
  `);

  // Indexes
  await client.query("CREATE INDEX IF NOT EXISTS idx_kitabs_book_id ON kitabs(book_id)");
  await client.query("CREATE INDEX IF NOT EXISTS idx_chapters_kitab_id ON chapters(kitab_id)");
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_hadeeth_chapter_reference
    ON hadeeth(chapter_id, reference_number)
    WHERE chapter_id IS NOT NULL AND reference_number IS NOT NULL
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_kitabs_book_title
    ON kitabs(book_id, title)
  `);
  await client.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_chapters_kitab_title
    ON chapters(kitab_id, title)
  `);

  // Seed languages
  await client.query("INSERT INTO languages (code, name) VALUES ('ar', 'Arabic') ON CONFLICT (code) DO NOTHING");
  await client.query("INSERT INTO languages (code, name) VALUES ('ta', 'Tamil') ON CONFLICT (code) DO NOTHING");

  console.log("✅  Schema ready");
}

async function importData(client, jsonPath) {
  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  // Insert book
  await client.query(`
    INSERT INTO books (id, title, author, notes, is_published, lang_code)
    VALUES ($1, $2, $3, $4, true, 'ar')
    ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
  `, [BOOK_ID, BOOK_TITLE_AR, "Shaykh Muhammad al-Mālikī", "Maʿālim as-Sunnah an-Nabawiyyah"]);

  console.log(`✓  Book: ${BOOK_TITLE_AR}`);

  let totalKitabs = 0;
  let totalChapters = 0;
  let totalHadiths = 0;

  for (let mi = 0; mi < data.length; mi++) {
    const mabhath = data[mi];
    const kitabId = `kitab-${mi + 1}`;
    const mabhathAr = text(mabhath.arabic_title);
    const mabhathTa = text(mabhath.tamil_title);

    await client.query(`
      INSERT INTO kitabs (id, book_id, title, notes, lang_code, is_published)
      VALUES ($1, $2, $3, $4, 'ar', true)
      ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
    `, [kitabId, BOOK_ID, mabhathAr, `mabhath_index:${mi + 1};tamil_title:${mabhathTa}`]);
    totalKitabs++;

    const chapters = mabhath.chapters || [];

    for (let ci = 0; ci < chapters.length; ci++) {
      const chapter = chapters[ci];
      const chapterId = `chapter-${mi + 1}-${ci + 1}`;
      const chapterAr = text(chapter.arabic_title);
      const chapterTa = text(chapter.tamil_title);

      await client.query(`
        INSERT INTO chapters (id, title, kitab_id, book_id, notes, lang_code, is_published)
        VALUES ($1, $2, $3, $4, $5, 'ar', true)
        ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title
      `, [
        chapterId,
        chapterAr,
        kitabId,
        BOOK_ID,
        `mabhath_index:${mi + 1};chapter_index:${ci + 1};tamil_title:${chapterTa}`
      ]);
      totalChapters++;

      const hadiths = chapter.hadiths || [];

      for (let hi = 0; hi < hadiths.length; hi++) {
        const hadith = hadiths[hi];
        const hadithId = `hadith-${mi + 1}-${ci + 1}-${hi + 1}`;
        const arabicText = text(hadith.arabic_text);
        const tamilText = text(hadith.tamil_text);
        const englishText = "";
        const references = text(hadith.references);

        await client.query(`
          INSERT INTO hadeeth (id, chapter_id, reference_number, arabic, tamil, english, reported_by, grade, is_published)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          ON CONFLICT (id) DO UPDATE SET
            chapter_id = EXCLUDED.chapter_id,
            arabic = EXCLUDED.arabic,
            tamil = EXCLUDED.tamil,
            english = EXCLUDED.english
        `, [
          hadithId,
          chapterId,
          hi + 1,
          arabicText,
          tamilText,
          englishText,
          references || null,
          null
        ]);
        totalHadiths++;
      }
    }
  }

  console.log(`✓  Kitabs: ${totalKitabs}`);
  console.log(`✓  Chapters: ${totalChapters}`);
  console.log(`✓  Hadiths: ${totalHadiths}`);
}

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error("Usage: node scripts/setup-and-import.js <path-to-json-file>");
    process.exit(1);
  }

  console.log(`\n📖  Importing Maʿālim as-Sunnah an-Nabawiyyah\n`);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await setupSchema(client);
    await importData(client, path.resolve(jsonPath));
    await client.query("COMMIT");
    console.log(`\n✅  Done!\n`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`\n❌  Failed:`, error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
