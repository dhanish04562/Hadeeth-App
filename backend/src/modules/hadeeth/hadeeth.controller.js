const service = require("./hadeeth.service");

async function listHadeeth(req, res) {
  const filters = { ...req.query };
  if (filters.nodeId) filters.node_id = filters.nodeId;
  if (filters.chapterId) filters.node_id = filters.chapterId;
  if (filters.chapter_id) filters.node_id = filters.chapter_id;
  delete filters.nodeId;
  delete filters.chapterId;
  delete filters.chapter_id;
  const items = await service.listHadeeth(filters);
  res.json(items);
}

async function getHadeeth(req, res) {
  const item = await service.getHadeethById(req.params.id);
  if (!item) {
    return res.status(404).json({ message: "Hadeeth not found." });
  }
  return res.json(item);
}

async function createHadeeth(req, res) {
  const payload = { ...req.body };
  if (payload.chapter_id && !payload.node_id) payload.node_id = payload.chapter_id;
  delete payload.chapter_id;
  const item = await service.createHadeeth(payload);
  res.status(201).json(item);
}

async function updateHadeeth(req, res) {
  const payload = { ...req.body };
  if (payload.chapter_id && !payload.node_id) payload.node_id = payload.chapter_id;
  delete payload.chapter_id;
  const item = await service.updateHadeeth(req.params.id, payload);
  if (!item) {
    return res.status(404).json({ message: "Hadeeth not found." });
  }
  return res.json(item);
}

async function deleteHadeeth(req, res) {
  const removed = await service.deleteHadeeth(req.params.id);
  return removed ? res.status(204).send() : res.status(404).json({ message: "Hadeeth not found." });
}

module.exports = {
  listHadeeth,
  getHadeeth,
  createHadeeth,
  updateHadeeth,
  deleteHadeeth
};
