const express = require("express");
const router = express.Router();
const {
  getUsers,
  deleteUser,
  updateUserRole,
  blockUser,
  getStats,
  getResources,
  deleteResourceAdmin,
  getMentorships,
  getNotifications,
  createNotification,
  getSeniorsAdmin,
  getSeniorById,
  toggleSeniorBlock,
  toggleMentorStatus,
  getSeniorAnalytics,
  createEvent,
  deleteEvent,
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

// Apply middleware to all admin routes
router.use(protect, admin);

router.route("/stats").get(getStats);

router.route("/users").get(getUsers);
router.route("/users/:id").delete(deleteUser);
router.route("/users/:id/role").put(updateUserRole);
router.route("/users/:id/block").put(blockUser);

router.route("/resources").get(getResources);
router.route("/resources/:id").delete(deleteResourceAdmin);

router.route("/mentorships").get(getMentorships);

router.route("/notifications").get(getNotifications).post(createNotification);

// Senior Management Routes
router.route("/seniors").get(getSeniorsAdmin);
router.route("/senior-analytics").get(getSeniorAnalytics);
router.route("/seniors/:id").get(getSeniorById);
router.route("/senior/:id/block").patch(toggleSeniorBlock);
router.route("/senior/:id/mentor-status").patch(toggleMentorStatus);

// Event Management Routes
router.route("/events").post(createEvent);
router.route("/events/:id").delete(deleteEvent);

module.exports = router;
