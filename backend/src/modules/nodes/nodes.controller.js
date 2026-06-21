const service = require("./nodes.service");

async function listNodes(req, res) {
  const nodes = await service.listNodes(req.query);
  res.json(nodes);
}

async function getNode(req, res) {
  const node = await service.getNodeById(req.params.id);
  if (!node) {
    return res.status(404).json({ message: "Node not found." });
  }
  return res.json(node);
}

async function getNodeChildren(req, res) {
  const children = await service.getNodeChildren(req.params.id, req.query);
  res.json(children);
}

async function getNodeAncestors(req, res) {
  const ancestors = await service.getNodeAncestors(req.params.id);
  res.json(ancestors);
}

async function createNode(req, res) {
  const node = await service.createNode(req.body);
  res.status(201).json(node);
}

async function updateNode(req, res) {
  const node = await service.updateNode(req.params.id, req.body);
  if (!node) {
    return res.status(404).json({ message: "Node not found." });
  }
  return res.json(node);
}

async function deleteNode(req, res) {
  try {
    const removed = await service.deleteNode(req.params.id);
    return removed ? res.status(204).send() : res.status(404).json({ message: "Node not found." });
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ message: err.message });
    }
    throw err;
  }
}

module.exports = {
  listNodes,
  getNode,
  getNodeChildren,
  getNodeAncestors,
  createNode,
  updateNode,
  deleteNode
};
