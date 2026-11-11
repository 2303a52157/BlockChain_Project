// Covers the 5 planned test cases from the presentation (slide 14)
const { expect } = require("chai");
const { ethers } = require("hardhat");
const crypto = require("crypto");

const sha = (s) => "0x" + crypto.createHash("sha256").update(s).digest("hex");

describe("SkillVerification", () => {
  let contract, admin, student;
  const goodPdf = sha("original-nptel-python.pdf");
  const editedPdf = sha("EDITED-nptel-python.pdf");

  beforeEach(async () => {
    [admin, student] = await ethers.getSigners();
    const F = await ethers.getContractFactory("SkillVerification");
    contract = await F.deploy();
    await contract.waitForDeployment();
  });

  it("1. correct certificate + ID -> Verified", async () => {
    await contract.recordSkill("CERT-2026-0142", goodPdf);
    const [found, valid] = await contract.checkSkill("CERT-2026-0142", goodPdf);
    expect(found).to.equal(true);
    expect(valid).to.equal(true);
  });

  it("2. edited PDF -> hash mismatch -> Not verified", async () => {
    await contract.recordSkill("CERT-2026-0142", goodPdf);
    const [found, valid] = await contract.checkSkill("CERT-2026-0142", editedPdf);
    expect(found).to.equal(true);
    expect(valid).to.equal(false);
  });

  it("3. unknown certificate ID -> Record not found", async () => {
    const [found] = await contract.checkSkill("CERT-UNKNOWN", goodPdf);
    expect(found).to.equal(false);
  });

  it("4. non-admin tries to record -> rejected", async () => {
    await expect(
      contract.connect(student).recordSkill("CERT-1", goodPdf)
    ).to.be.revertedWith("Not an authorised admin");
  });

  it("5. duplicate certificate ID -> rejected", async () => {
    await contract.recordSkill("CERT-1", goodPdf);
    await expect(contract.recordSkill("CERT-1", goodPdf)).to.be.revertedWith(
      "Duplicate certificate ID"
    );
  });

  it("revoked certificate is no longer valid", async () => {
    await contract.recordSkill("CERT-1", goodPdf);
    await contract.revokeSkill("CERT-1");
    const [, valid, active] = await contract.checkSkill("CERT-1", goodPdf);
    expect(valid).to.equal(false);
    expect(active).to.equal(false);
  });
});
