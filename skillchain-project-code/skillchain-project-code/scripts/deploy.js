const { ethers } = require("hardhat");

async function main() {
  const F = await ethers.getContractFactory("SkillVerification");
  const c = await F.deploy();
  await c.waitForDeployment();
  console.log("SkillVerification deployed to:", await c.getAddress());
  console.log("Copy this address into backend/.env as CONTRACT_ADDRESS");
}

main().catch((e) => { console.error(e); process.exit(1); });
