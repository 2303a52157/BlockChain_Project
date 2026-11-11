const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    certId: { type: String, required: true, unique: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    skill: { type: String, required: true },
    issuer: { type: String, required: true },
    fileName: String,
    fileData: Buffer,                       // PDF stays off-chain
    fileHash: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected", "revoked"], default: "pending" },
    txHash: String,                         // blockchain transaction of approval
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
