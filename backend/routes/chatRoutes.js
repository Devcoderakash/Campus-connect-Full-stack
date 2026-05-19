const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/authMiddleware");
const {
  getConversations,
  getMessages,
  sendMessage,
  markSeen,
} = require("../controllers/chatController");

// ── TEMPORARY MAINTENANCE INTERCEPTOR ──
// All chat routes are temporarily disabled for the upcoming messaging upgrade.
router.use((req, res, next) => {
  return res.status(503).json({
    success: false,
    message: "Chat feature temporarily unavailable. We are currently upgrading the messaging experience."
  });
});

// Original Routes kept intact for future re-enablement:
router.get("/conversations", protect, getConversations);
router.get("/messages/:conversationId", protect, getMessages);
router.post("/send", protect, sendMessage);
router.put("/seen/:conversationId", protect, markSeen);

module.exports = router;
