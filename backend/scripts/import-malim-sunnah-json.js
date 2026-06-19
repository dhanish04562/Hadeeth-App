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

async function ensureLanguages(client) {
  for (const [code, name] of Object.entries({ ar: "Arabic", ta: "Tamil" })) {
    await client.query(
      `INSERT INTO languages (code, name) VALUES ($1, $2) ON CONFLICT (code) DO NOTHING`,
      [code, name]
    );
  }
}

async function ensureBook(client) {
  const { rows } = await client.query(`SELECT id FROM books WHERE id = $1`, [BOOK_ID]);
  if (rows.length) return BOOK_ID;

  await client.query(
    `INSERT INTO books (id, title, author, notes, is_published, lang_code)
     VALUES ($1, $2, $3, $4, true, 'ar')`,
    [BOOK_ID, BOOK_TITLE_AR, "Shaykh Muhammad al-Mālikī", "Maʿālim as-Sunnah an-Nabawiyyah"]
  );
  return BOOK_ID;
}

async function importJson(jsonPath) {
  console.log(`\n📖  Importing Maʿālim as-Sunnah an-Nabawiyyah from: ${jsonPath}\n`);

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await ensureLanguages(client);
    const bookId = await ensureBook(client);
    console.log(`✓  Book ready: ${BOOK_TITLE_AR} (${bookId})`);

    let totalKitabs = 0;
    let totalChapters = 0;
    let totalHadiths = 0;

    for (let mi = 0; mi < data.length; mi++) {
      const mabhath = data[mi];
      const kitabId = `kitab-${mi + 1}`;
      const mabhathAr = text(mabhath.arabic_title);
      const mabhathTa = text(mabhath.tamil_title);

      await client.query(
        `INSERT INTO kitabs (id, book_id, title, notes, lang_code, is_published)
         VALUES ($1, $2, $3, $4, 'ar', true)
         ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true`,
        [kitabId, bookId, mabhathAr, `mabhath_index:${mi + 1};tamil_title:${mabhathTa}`]
      );
      totalKitabs++;

      const chapters = mabhath.chapters || [];

      for (let ci = 0; ci < chapters.length; ci++) {
        const chapter = chapters[ci];
        const chapterId = `chapter-${mi + 1}-${ci + 1}`;
        const chapterAr = text(chapter.arabic_title);
        const chapterTa = text(chapter.tamil_title);

        await client.query(
          `INSERT INTO chapters (id, title, kitab_id, book_id, notes, lang_code, is_published)
           VALUES ($1, $2, $3, $4, $5, 'ar', true)
           ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true`,
          [
            chapterId,
            chapterAr,
            kitabId,
            bookId,
            `mabhath_index:${mi + 1};chapter_index:${ci + 1};tamil_title:${chapterTa}`
          ]
        );
        totalChapters++;

        const hadiths = chapter.hadiths || [];

        for (let hi = 0; hi < hadiths.length; hi++) {
          const hadith = hadiths[hi];
          const hadithId = `hadith-${mi + 1}-${ci + 1}-${hi + 1}`;
          const arabicText = text(hadith.arabic_text);
          const tamilText = text(hadith.tamil_text);
          const references = text(hadith.references);

          await client.query(
            `INSERT INTO hadeeth (id, chapter_id, reference_number, arabic, english, reported_by, grade, is_published)
             VALUES ($1, $2, $3, $4, $5, $6, $7, true)
             ON CONFLICT (id) DO UPDATE SET
               chapter_id = EXCLUDED.chapter_id,
               arabic = EXCLUDED.arabic,
               english = EXCLUDED.english,
               is_published = true`,
            [
              hadithId,
              chapterId,
              hi + 1,
              arabicText,
              tamilText,
              references || null,
              null
            ]
          );
          totalHadiths++;
        }
      }
    }

    await client.query("COMMIT");
    console.log(`\n✅  Import complete!`);
    console.log(`    Kitabs: ${totalKitabs}`);
    console.log(`    Chapters: ${totalChapters}`);
    console.log(`    Hadiths: ${totalHadiths}\n`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`\n❌  Import failed:`, error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Usage: node scripts/import-malim-sunnah-json.js <path-to-json-file>");
  process.exit(1);
}

importJson(path.resolve(jsonPath)).catch((err) => {
  console.error(err);
  process.exit(1);
});
