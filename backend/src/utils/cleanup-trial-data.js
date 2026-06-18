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
      WHERE
        c.id = ANY($1::varchar[])
        OR COALESCE(c.notes, '') ILIKE '%trial%'
        OR COALESCE(c.notes, '') ILIKE '%sample%'
    `;

    const deletedHadeeth = await client.query(
      `
        DELETE FROM hadeeth h
        WHERE NOT (
          h.id = ANY($2::varchar[])
          OR h.chapter_id IN (${keepChaptersSql})
        )
      `,
      [TRIAL_CHAPTER_IDS, TRIAL_HADEETH_IDS]
    );

    const deletedChapters = await client.query(
      `
        DELETE FROM chapters c
        WHERE c.id NOT IN (${keepChaptersSql})
      `,
      [TRIAL_CHAPTER_IDS]
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

async function previewTrialDataCleanup(pool) {
  const { rows } = await pool.query(
    `
      WITH keep_chapters AS (
        SELECT c.id
        FROM chapters c
        WHERE
          c.id = ANY($1::varchar[])
          OR COALESCE(c.notes, '') ILIKE '%trial%'
          OR COALESCE(c.notes, '') ILIKE '%sample%'
      )
      SELECT
        (SELECT COUNT(*)::int FROM chapters) AS chapters,
        (SELECT COUNT(*)::int FROM hadeeth) AS hadeeth,
        (SELECT COUNT(*)::int FROM keep_chapters) AS chapters_to_keep,
        (
          SELECT COUNT(*)::int
          FROM hadeeth h
          WHERE h.id = ANY($2::varchar[])
            OR h.chapter_id IN (SELECT id FROM keep_chapters)
        ) AS hadeeth_to_keep,
        (
          SELECT COUNT(*)::int
          FROM chapters c
          WHERE c.id NOT IN (SELECT id FROM keep_chapters)
        ) AS chapters_to_delete,
        (
          SELECT COUNT(*)::int
          FROM hadeeth h
          WHERE NOT (
            h.id = ANY($2::varchar[])
            OR h.chapter_id IN (SELECT id FROM keep_chapters)
          )
        ) AS hadeeth_to_delete
    `,
    [TRIAL_CHAPTER_IDS, TRIAL_HADEETH_IDS]
  );

  return rows[0];
}

module.exports = cleanupTrialData;
module.exports.previewTrialDataCleanup = previewTrialDataCleanup;
