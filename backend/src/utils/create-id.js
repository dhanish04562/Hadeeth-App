const crypto = require("crypto");

function createId() {
  return crypto.randomBytes(12).toString("hex");
}

module.exports = createId;
