const hadeethService = require("./hadeeth.service");

async function listHadeeth(req, res) {
  const records = await hadeethService.listHadeeth(req.query);
  res.json(records);
}

async function getHadeeth(req, res) {
  const record = await hadeethService.getHadeethById(req.params.id);

  if (!record) {
    return res.status(404).json({ message: "Hadeeth not found" });
  }

  return res.json(record);
}

async function createHadeeth(req, res) {
  const record = await hadeethService.createHadeeth(req.body);
  res.status(201).json(record);
}

async function updateHadeeth(req, res) {
  const record = await hadeethService.updateHadeeth(req.params.id, req.body);

  if (!record) {
    return res.status(404).json({ message: "Hadeeth not found" });
  }

  return res.json(record);
}

async function deleteHadeeth(req, res) {
  const removed = await hadeethService.deleteHadeeth(req.params.id);

  if (!removed) {
    return res.status(404).json({ message: "Hadeeth not found" });
  }

  return res.status(204).send();
}

module.exports = {
  listHadeeth,
  getHadeeth,
  createHadeeth,
  updateHadeeth,
  deleteHadeeth
};
