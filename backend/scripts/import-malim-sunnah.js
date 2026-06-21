require("dotenv").config();

const XLSX = require("xlsx");
const path = require("path");
const pool = require("../src/db/pool");
const createId = require("../src/utils/create-id");

const BOOK_ID = "book-malim-sunnah";
const BOOK_TITLE_AR = "معالم السنة النبوية";
const BOOK_TITLE_TA = "மஆலிமுஸ் ஸுன்னாவின் நபவிய்யா";

const LANGS = { ar: "ar", ta: "ta" };

function text(value, fallback = "") {
  return typeof value === "string" ? value.trim() : String(value ?? fallback).trim();
}

function stripBom(value) {
  if (typeof value === "string" && value.charCodeAt(0) === 0xfeff) {
    return value.slice(1);
  }
  return value;
}

function normalizeKey(key) {
  return stripBom(text(key))
    .replace(/[\s-_]+/g, "_")
    .replace(/[^a-zA-Z0-9_]/g, "")
    .toLowerCase();
}

function normalizeRow(row) {
  const out = {};
  for (const [key, value] of Object.entries(row)) {
    out[normalizeKey(key)] = value;
  }
  return out;
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
    [BOOK_ID, BOOK_TITLE_AR, "Shaykh Muhammad al‑Mālikī", "Maʿālim as-Sunnah an-Nabawiyyah"]
  );
  return BOOK_ID;
}

async function importMabahith(client, workbook, bookId) {
  const sheet = workbook.Sheets["mabahith"];
  if (!sheet) {
    console.warn("⚠  Sheet 'mabahith' not found. Skipping.");
    return {};
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const kitabMap = {};

  for (const raw of rows) {
    const row = normalizeRow(raw);
    const id = text(row.id);
    const arabicTitle = text(row.arabic_title);
    const tamilTitle = text(row.tamil_title);

    if (!id || !arabicTitle) {
      console.warn(`⚠  Skipping mabhath row (missing id or arabic_title):`, JSON.stringify(row));
      continue;
    }

    const kitabId = `kitab-${id}`;

    await client.query(
      `INSERT INTO kitabs (id, book_id, title, notes, lang_code, is_published)
       VALUES ($1, $2, $3, $4, 'ar', true)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true`,
      [kitabId, bookId, arabicTitle, `mabhath_id:${id}`]
    );

    kitabMap[id] = { kitabId, arabicTitle, tamilTitle };
  }

  console.log(`✓  Imported ${Object.keys(kitabMap).length} mabahith as kitabs`);
  return kitabMap;
}

async function importAbwab(client, workbook, bookId, kitabMap) {
  const sheet = workbook.Sheets["abwab"];
  if (!sheet) {
    console.warn("⚠  Sheet 'abwab' not found. Skipping.");
    return {};
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  const babMap = {};

  for (const raw of rows) {
    const row = normalizeRow(raw);
    const id = text(row.id);
    const mabhathId = text(row.mabhath_id);
    const arabicTitle = text(row.arabic_title);
    const tamilTitle = text(row.tamil_title);

    if (!id || !arabicTitle) {
      console.warn(`⚠  Skipping bab row (missing id or arabic_title):`, JSON.stringify(row));
      continue;
    }

    const kitabInfo = kitabMap[mabhathId];
    const kitabId = kitabInfo ? kitabInfo.kitabId : null;

    if (!kitabId) {
      console.warn(`⚠  Bab ${id}: mabhath_id "${mabhathId}" not found in mabahith. Skipping.`);
      continue;
    }

    const chapterId = `chapter-${id}`;

    await client.query(
      `INSERT INTO chapters (id, title, kitab_id, book_id, notes, lang_code, is_published)
       VALUES ($1, $2, $3, $4, $5, 'ar', true)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, is_published = true`,
      [chapterId, arabicTitle, kitabId, bookId, `bab_id:${id};mabhath_id:${mabhathId}`]
    );

    babMap[id] = { chapterId, arabicTitle, tamilTitle, kitabId };
  }

  console.log(`✓  Imported ${Object.keys(babMap).length} abwab as chapters`);
  return babMap;
}

async function importHadiths(client, workbook, bookId, babMap) {
  const sheet = workbook.Sheets["hadiths"];
  if (!sheet) {
    console.warn("⚠  Sheet 'hadiths' not found. Skipping.");
    return { imported: 0, skipped: 0 };
  }

  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  let imported = 0;
  let skipped = 0;

  for (const raw of rows) {
    const row = normalizeRow(raw);
    const id = text(row.id);
    const babId = text(row.bab_id);
    const arabicText = text(row.arabic_text);
    const tamilText = text(row.tamil_text);
    const references = text(row.references);

    if (!id || !arabicText) {
      console.warn(`⚠  Skipping hadith row (missing id or arabic_text):`, JSON.stringify(row));
      skipped++;
      continue;
    }

    const babInfo = babMap[babId];
    const chapterId = babInfo ? babInfo.chapterId : null;

    if (!chapterId) {
      console.warn(`⚠  Hadith ${id}: bab_id "${babId}" not found in abwab. Skipping.`);
      skipped++;
      continue;
    }

    const hadithId = `hadith-${id}`;

    await client.query(
      `INSERT INTO hadeeth (id, chapter_id, reference_number, arabic, tamil, english, reported_by, grade, is_published)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
       ON CONFLICT (id) DO UPDATE SET
         chapter_id = EXCLUDED.chapter_id,
         arabic = EXCLUDED.arabic,
         tamil = EXCLUDED.tamil,
         english = EXCLUDED.english,
         is_published = true`,
      [
        hadithId,
        chapterId,
        imported + 1,
        arabicText,
        tamilText,
        null,
        references || null,
        null
      ]
    );

    imported++;
  }

  console.log(`✓  Imported ${imported} hadiths (${skipped} skipped)`);
  return { imported, skipped };
}

async function importMalimSunnah(excelPath) {
  console.log(`\n📖  Importing Maʿālim as-Sunnah an-Nabawiyyah from: ${excelPath}\n`);

  const workbook = XLSX.readFile(excelPath);
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await ensureLanguages(client);
    const bookId = await ensureBook(client);
    console.log(`✓  Book ready: ${BOOK_TITLE_AR} (${bookId})`);

    const kitabMap = await importMabahith(client, workbook, bookId);

    if (Object.keys(kitabMap).length === 0) {
      console.warn("⚠  No mabahith imported. Skipping abwab and hadiths.");
      await client.query("ROLLBACK");
      return;
    }

    const babMap = await importAbwab(client, workbook, bookId, kitabMap);

    if (Object.keys(babMap).length === 0) {
      console.warn("⚠  No abwab imported. Skipping hadiths.");
      await client.query("ROLLBACK");
      return;
    }

    await importHadiths(client, workbook, bookId, babMap);

    await client.query("COMMIT");
    console.log(`\n✅  Import complete!\n`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(`\n❌  Import failed:`, error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

const excelPath = process.argv[2];
if (!excelPath) {
  console.error("Usage: node scripts/import-malim-sunnah.js <path-to-excel-file>");
  process.exit(1);
}

importMalimSunnah(path.resolve(excelPath)).catch((err) => {
  console.error(err);
  process.exit(1);
});
