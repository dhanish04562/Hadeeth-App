const chaptersService = require("./chapters.service");

async function listChapters(req, res) {
  const chapters = await chaptersService.listChapters(req.query);
  res.json(chapters);
}

async function getChapter(req, res) {
  const chapter = await chaptersService.getChapterById(req.params.id);

  if (!chapter) {
    return res.status(404).json({ message: "Chapter not found" });
  }

  return res.json(chapter);
}

async function createChapter(req, res) {
  const chapter = await chaptersService.createChapter(req.body);
  res.status(201).json(chapter);
}

async function updateChapter(req, res) {
  const chapter = await chaptersService.updateChapter(req.params.id, req.body);

  if (!chapter) {
    return res.status(404).json({ message: "Chapter not found" });
  }

  return res.json(chapter);
}

async function deleteChapter(req, res) {
  const removed = await chaptersService.deleteChapter(req.params.id);

  if (!removed) {
    return res.status(404).json({ message: "Chapter not found" });
  }

  return res.status(204).send();
}

module.exports = {
  listChapters,
  getChapter,
  createChapter,
  updateChapter,
  deleteChapter
};
