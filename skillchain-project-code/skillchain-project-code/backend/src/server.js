require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/auth"));
app.use("/api/certificates", require("./routes/certificates"));

// error handler (e.g. multer file errors)
app.use((err, _req, res, _next) => res.status(400).json({ error: err.message }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT || 5000, () => console.log("API running on port", process.env.PORT || 5000)))
  .catch((e) => console.error("MongoDB connection failed:", e.message));
