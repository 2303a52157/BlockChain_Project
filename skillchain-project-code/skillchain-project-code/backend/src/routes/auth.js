const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    // Public sign-up may only create students/recruiters. Admins are created by the college.
    const safeRole = role === "recruiter" ? "recruiter" : "student";
    if (await User.findOne({ email })) return res.status(409).json({ error: "Email already registered" });
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10), role: safeRole });
    res.status(201).json({ id: user._id, name: user.name, role: user.role });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: "Invalid email or password" });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "8h" });
  res.json({ token, user: { name: user.name, role: user.role } });
});

module.exports = router;
