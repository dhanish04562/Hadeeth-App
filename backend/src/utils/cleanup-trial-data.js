const TRIAL_BOOK_IDS = ["book-bukhari", "book-muslim"];
const TRIAL_CHAPTER_IDS = ["chapter-revelation", "chapter-faith", "chapter-purity"];
const TRIAL_HADEETH_IDS = [
  "hadith-intentions",
  "hadith-revelation-bell",
  "hadith-faith-branches",
  "hadith-purity-half-faith"
];

async function cleanupTrialData(pool) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows: beforeRows } = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM chapters) AS chapters,
        (SELECT COUNT(*)::int FROM hadeeth) AS hadeeth
    `);

    const keepChaptersSql = `
      SELECT c.id
      FROM chapters c
      LEFT JOIN books b ON b.id = c.book_id
      WHERE
        c.id = ANY($2::varchar[])
        OR b.id = ANY($1::varchar[])
        OR COALESCE(b.title, '') ILIKE '%trial%'
        OR COALESCE(b.notes, '') ILIKE '%trial%'
    `;

    const deletedHadeeth = await client.query(
      `
        DELETE FROM hadeeth h
        WHERE NOT (
          h.id = ANY($3::varchar[])
          OR h.chapter_id IN (${keepChaptersSql})
        )
      `,
      [TRIAL_BOOK_IDS, TRIAL_CHAPTER_IDS, TRIAL_HADEETH_IDS]
    );

    const deletedChapters = await client.query(
      `
        DELETE FROM chapters c
        WHERE c.id NOT IN (${keepChaptersSql})
      `,
      [TRIAL_BOOK_IDS, TRIAL_CHAPTER_IDS]
    );

    const { rows: afterRows } = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM chapters) AS chapters,
        (SELECT COUNT(*)::int FROM hadeeth) AS hadeeth
    `);

    await client.query("COMMIT");

    return {
      before: beforeRows[0],
      after: afterRows[0],
      deleted: {
        chapters: deletedChapters.rowCount,
        hadeeth: deletedHadeeth.rowCount
      }
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = cleanupTrialData;
