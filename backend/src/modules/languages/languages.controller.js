const languagesService = require("./languages.service");

async function listLanguages(req, res) {
  const languages = await languagesService.listLanguages(req.query);
  res.json(languages);
}

async function getLanguage(req, res) {
  const language = await languagesService.getLanguageByCode(req.params.code);

  if (!language) {
    return res.status(404).json({ message: "Language not found" });
  }

  return res.json(language);
}

async function createLanguage(req, res) {
  const language = await languagesService.createLanguage(req.body);
  res.status(201).json(language);
}

async function updateLanguage(req, res) {
  const language = await languagesService.updateLanguage(req.params.code, req.body);

  if (!language) {
    return res.status(404).json({ message: "Language not found" });
  }

  return res.json(language);
}

async function deleteLanguage(req, res) {
  const removed = await languagesService.deleteLanguage(req.params.code);

  if (!removed) {
    return res.status(404).json({ message: "Language not found" });
  }

  return res.status(204).send();
}

module.exports = {
  listLanguages,
  getLanguage,
  createLanguage,
  updateLanguage,
  deleteLanguage
};
