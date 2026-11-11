// Run once: node src/seedAdmin.js  -> creates the TPO/admin account
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await User.deleteOne({ email: "admin@sru.edu" });
  await User.create({ name: "TPO Admin", email: "admin@sru.edu", password: await bcrypt.hash("Admin@123", 10), role: "admin" });
  console.log("Admin created: admin@sru.edu / Admin@123  (change this password!)");
  process.exit(0);
})();
