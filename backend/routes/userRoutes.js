const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  searchUsers,
  getSeniors,
  getProfileStats,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { getVerificationFolderStructure, uploadFileToDrive } = require("../services/googleDriveService");

// Ensure temp directory exists
const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const tempStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  // Enforce rigid allowed MIME types for uploads
  const allowedMimeTypes = ["image/png", "image/jpeg", "image/jpg", "application/pdf"];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PNG, JPEG, JPG, and PDF documents are allowed."), false);
  }
};

const localUpload = multer({
  storage: tempStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB Limit
  },
  fileFilter: fileFilter,
});

router.get("/profile/stats", protect, getProfileStats);
router.route("/profile").get(protect, getProfile).put(protect, updateProfile);
router.get("/search", protect, searchUsers);
router.get("/seniors", protect, getSeniors);

// Rebuilt Google Drive Upload Route
router.post("/upload", protect, (req, res) => {
  localUpload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }

    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Upload directly into "Pending Seniors" folder on Google Drive
      const folderStructure = await getVerificationFolderStructure();
      const uploadResult = await uploadFileToDrive(
        req.file.path,
        req.file.mimetype,
        req.file.originalname,
        folderStructure.pendingFolderId
      );

      // Instantly delete local temporary file
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) console.error("⚠️ Temporary file deletion failed:", unlinkErr.message);
      });

      res.json({
        success: true,
        message: "File uploaded successfully to Google Drive",
        url: uploadResult.previewUrl,
        driveFileId: uploadResult.driveFileId,
        previewUrl: uploadResult.previewUrl,
        downloadUrl: uploadResult.downloadUrl,
      });
    } catch (uploadErr) {
      // Clean up temp file on failed stream
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({
        success: false,
        message: "Failed to upload to Google Drive",
        error: uploadErr.message,
      });
    }
  });
});

module.exports = router;
