const { ethers } = require("ethers");

const ABI = [
  "function recordSkill(string certId, bytes32 fileHash)",
  "function revokeSkill(string certId)",
  "function checkSkill(string certId, bytes32 fileHash) view returns (bool found, bool valid, bool active)",
  "function getRecord(string certId) view returns (bytes32 fileHash, address approvedBy, uint256 approvedOn, bool active)",
];

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, wallet);

async function recordSkill(certId, fileHash) {
  const tx = await contract.recordSkill(certId, fileHash);
  const receipt = await tx.wait();
  return receipt.hash; // transaction hash
}

async function revokeSkill(certId) {
  const tx = await contract.revokeSkill(certId);
  return (await tx.wait()).hash;
}

async function checkSkill(certId, fileHash) {
  const [found, valid, active] = await contract.checkSkill(certId, fileHash);
  if (!found) return { status: "NOT_FOUND" };
  const [, approvedBy, approvedOn] = await contract.getRecord(certId);
  return {
    status: valid ? "VERIFIED" : active ? "HASH_MISMATCH" : "REVOKED",
    approvedBy,
    approvedOn: new Date(Number(approvedOn) * 1000).toISOString(),
  };
}

module.exports = { recordSkill, revokeSkill, checkSkill };
