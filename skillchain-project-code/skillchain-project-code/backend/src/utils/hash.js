const crypto = require("crypto");

// SHA-256 of the raw PDF bytes -> "0x" + 64 hex chars (fits bytes32)
function sha256Hex(buffer) {
  return "0x" + crypto.createHash("sha256").update(buffer).digest("hex");
}

module.exports = { sha256Hex };
