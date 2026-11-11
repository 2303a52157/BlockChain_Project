const router = require("express").Router();
const multer = require("multer");
const Certificate = require("../models/Certificate");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sha256Hex } = require("../utils/hash");
const chain = require("../utils/blockchain");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_, file, cb) =>
    file.mimetype === "application/pdf" ? cb(null, true) : cb(new Error("Only PDF files allowed")),
});

// ---------- STUDENT ----------
// POST /api/certificates   (multipart: file, certId, skill, issuer)
router.post("/", requireAuth, requireRole("student"), upload.single("file"), async (req, res) => {
  try {
    const { certId, skill, issuer } = req.body;
    if (!req.file) return res.status(400).json({ error: "PDF file is required" });
    if (await Certificate.findOne({ certId }))
      return res.status(409).json({ error: "Duplicate certificate ID" });

    const cert = await Certificate.create({
      certId, skill, issuer,
      student: req.user.id,
      fileName: req.file.originalname,
      fileData: req.file.buffer,
      fileHash: sha256Hex(req.file.buffer),
    });
    res.status(201).json({ certId: cert.certId, status: cert.status, fileHash: cert.fileHash });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// GET /api/certificates/mine
router.get("/mine", requireAuth, requireRole("student"), async (req, res) => {
  const list = await Certificate.find({ student: req.user.id }).select("-fileData").sort("-createdAt");
  res.json(list);
});

// ---------- ADMIN / TPO ----------
// GET /api/certificates/pending
router.get("/pending", requireAuth, requireRole("admin"), async (_, res) => {
  const list = await Certificate.find({ status: "pending" }).select("-fileData").populate("student", "name email");
  res.json(list);
});

// GET /api/certificates/:certId/file  -> admin downloads the PDF to check it with the issuer
router.get("/:certId/file", requireAuth, requireRole("admin"), async (req, res) => {
  const c = await Certificate.findOne({ certId: req.params.certId });
  if (!c) return res.status(404).json({ error: "Not found" });
  res.contentType("application/pdf").send(c.fileData);
});

// POST /api/certificates/:certId/approve  -> writes hash on-chain
router.post("/:certId/approve", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const c = await Certificate.findOne({ certId: req.params.certId });
    if (!c) return res.status(404).json({ error: "Not found" });
    if (c.status !== "pending") return res.status(400).json({ error: `Already ${c.status}` });

    c.txHash = await chain.recordSkill(c.certId, c.fileHash); // smart contract call
    c.status = "approved";
    c.reviewedBy = req.user.id;
    await c.save();
    res.json({ certId: c.certId, status: c.status, txHash: c.txHash });
  } catch (e) {
    res.status(500).json({ error: e.reason || e.message });
  }
});

// POST /api/certificates/:certId/reject
router.post("/:certId/reject", requireAuth, requireRole("admin"), async (req, res) => {
  const c = await Certificate.findOneAndUpdate(
    { certId: req.params.certId, status: "pending" },
    { status: "rejected", reviewedBy: req.user.id },
    { new: true }
  ).select("-fileData");
  if (!c) return res.status(404).json({ error: "Pending certificate not found" });
  res.json(c);
});

// POST /api/certificates/:certId/revoke
router.post("/:certId/revoke", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const c = await Certificate.findOne({ certId: req.params.certId, status: "approved" });
    if (!c) return res.status(404).json({ error: "Approved certificate not found" });
    c.txHash = await chain.revokeSkill(c.certId);
    c.status = "revoked";
    await c.save();
    res.json({ certId: c.certId, status: c.status, txHash: c.txHash });
  } catch (e) {
    res.status(500).json({ error: e.reason || e.message });
  }
});

// ---------- RECRUITER ----------
// POST /api/certificates/verify   (multipart: file, certId)
router.post("/verify", requireAuth, requireRole("recruiter", "admin"), upload.single("file"), async (req, res) => {
  try {
    const { certId } = req.body;
    if (!req.file || !certId) return res.status(400).json({ error: "certId and PDF are required" });
    const result = await chain.checkSkill(certId, sha256Hex(req.file.buffer));
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
