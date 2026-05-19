const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // Password is optional — Google OAuth users won't have one
    password: { type: String },

    // Google OAuth fields
    googleId: { type: String, sparse: true, unique: true },
    profileImage: { type: String }, // Stores Google profile picture URL

    branch: { type: String, default: "" },
    year: { type: Number, default: 1 },
    role: {
      type: String,
      enum: ["junior", "pending_senior", "senior", "admin", "Junior", "Senior", "Admin"],
      default: "junior",
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "none"],
      default: "none",
    },
    collegeIdUrl: { type: String },
    collegeIdDriveFileId: { type: String },
    collegeIdPreviewUrl: { type: String },
    collegeIdDownloadUrl: { type: String },
    verificationSubmittedAt: { type: Date },
    verificationReviewedAt: { type: Date },
    verificationReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectionReason: { type: String, default: "" },
    verifiedBadge: { type: Boolean, default: false },
    skills: [{ type: String }],
    bio: { type: String },
    contact: { type: String },
    visibility: { type: Boolean, default: true },
    isMentorAvailable: { type: Boolean, default: true },
    github: { type: String },
    linkedin: { type: String },
    portfolio: { type: String },
    leetcode: { type: String },
    codechef: { type: String },
    hackerrank: { type: String },
    twitter: { type: String },
    bookmarkedMentors: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mentorStats: {
      totalRequests: { type: Number, default: 0 },
      acceptedRequests: { type: Number, default: 0 },
      rejectedRequests: { type: Number, default: 0 },
      activeChats: { type: Number, default: 0 },
      contributionCount: { type: Number, default: 0 },
    },
    lastActive: { type: Date, default: Date.now },
    isBlocked: { type: Boolean, default: false },
    mentorRating: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("User", userSchema);
