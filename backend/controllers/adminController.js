const User = require("../models/User");
const Resource = require("../models/Resource");
const Update = require("../models/Update");
const Mentorship = require("../models/Mentorship");
const Message = require("../models/Message");
const Notification = require("../models/Notification");
const Event = require("../models/Event");
const drive = require("../config/googleDrive");

const getUsers = async (req, res) => {
  try {
    const { role, search, page = 1, limit = 50 } = req.query;
    let query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    const total = await User.countDocuments(query);
    res.json({ users, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "Admin") return res.status(400).json({ message: "Cannot delete admin user" });

    await user.deleteOne();
    res.json({ message: "User removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = req.body.role || user.role;
    await user.save();
    res.json({ message: "User role updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "Admin") return res.status(400).json({ message: "Cannot block admin user" });

    user.visibility = !user.visibility;
    await user.save();
    res.json({ message: "User visibility toggled", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalSeniors = await User.countDocuments({ role: "Senior" });
    const totalJuniors = await User.countDocuments({ role: "Junior" });
    const totalResources = await Resource.countDocuments();
    const totalMentorships = await Mentorship.countDocuments();
    const totalMessages = await Message.countDocuments();
    const totalNotifications = await Notification.countDocuments();

    res.json({
      totalUsers,
      totalSeniors,
      totalJuniors,
      totalResources,
      totalMentorships,
      totalMessages,
      totalNotifications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getResources = async (req, res) => {
  try {
    const resources = await Resource.find({})
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });
    res.json(resources);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteResourceAdmin = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ message: "Resource not found" });

    if (resource.fileId) {
      try {
        await drive.files.delete({ fileId: resource.fileId });
      } catch (driveError) {
        console.error("Error deleting file from Google Drive:", driveError.message);
      }
    }
    await resource.deleteOne();
    res.json({ message: "Resource removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMentorships = async (req, res) => {
  try {
    const mentorships = await Mentorship.find({})
      .populate("seniorId", "name email")
      .populate("juniorId", "name email")
      .sort({ createdAt: -1 });
    res.json(mentorships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({})
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createNotification = async (req, res) => {
  try {
    const { title, message } = req.body;
    const users = await User.find({}).select("_id");

    const notificationsToInsert = users.map((user) => ({
      userId: user._id,
      title,
      message,
      type: "admin",
    }));

    if (notificationsToInsert.length > 0) {
      await Notification.insertMany(notificationsToInsert);
    }

    res.json({ message: "Notification broadcasted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// SENIOR MANAGEMENT APIs
// ==========================================

const getSeniorsAdmin = async (req, res) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    // Any user year >= 2 is considered a senior in the ecosystem
    let query = { year: { $gte: 2 } };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { branch: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (page - 1) * limit;
    const seniors = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ lastActive: -1, createdAt: -1 });

    const total = await User.countDocuments(query);
    res.json({ seniors, total, pages: Math.ceil(total / limit), page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSeniorById = async (req, res) => {
  try {
    const senior = await User.findById(req.params.id).select("-password").lean();
    if (!senior) return res.status(404).json({ message: "Senior not found" });

    // Dynamically calculate accurate stats to prevent sync issues
    const totalRequests = await Mentorship.countDocuments({ seniorId: senior._id });
    const acceptedRequests = await Mentorship.countDocuments({
      seniorId: senior._id,
      status: "Accepted",
    });
    const rejectedRequests = await Mentorship.countDocuments({
      seniorId: senior._id,
      status: "Rejected",
    });

    // Count distinct active chats (where this senior has exchanged messages)
    const activeChats = await Message.aggregate([
      { $match: { $or: [{ senderId: senior._id }, { receiverId: senior._id }] } },
      {
        $group: {
          _id: { $cond: [{ $eq: ["$senderId", senior._id] }, "$receiverId", "$senderId"] },
        },
      },
      { $count: "count" },
    ]);
    const activeChatsCount = activeChats.length > 0 ? activeChats[0].count : 0;

    const contributionCount = await Resource.countDocuments({ uploadedBy: senior._id });

    // Inject dynamic stats into the response object
    senior.mentorStats = {
      totalRequests,
      acceptedRequests,
      rejectedRequests,
      activeChats: activeChatsCount,
      contributionCount,
    };

    // Get recent resources by this senior
    const resources = await Resource.find({ uploadedBy: senior._id }).limit(5);

    res.json({ senior, resources });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleSeniorBlock = async (req, res) => {
  try {
    const senior = await User.findById(req.params.id);
    if (!senior) return res.status(404).json({ message: "Senior not found" });
    if (senior.role === "Admin")
      return res.status(400).json({ message: "Cannot block admin user" });

    senior.isBlocked = !senior.isBlocked;
    // Also toggle visibility so they don't appear in the seniors list if blocked
    senior.visibility = !senior.isBlocked;
    await senior.save();

    res.json({ message: `Senior ${senior.isBlocked ? "blocked" : "unblocked"}`, senior });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleMentorStatus = async (req, res) => {
  try {
    const senior = await User.findById(req.params.id);
    if (!senior) return res.status(404).json({ message: "Senior not found" });

    senior.isMentorAvailable = !senior.isMentorAvailable;
    await senior.save();

    res.json({ message: `Mentor status updated`, senior });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSeniorAnalytics = async (req, res) => {
  try {
    const totalSeniors = await User.countDocuments({ year: { $gte: 2 } });
    const activeMentors = await User.countDocuments({
      year: { $gte: 2 },
      isMentorAvailable: true,
      isBlocked: false,
    });
    const inactiveSeniors = await User.countDocuments({
      year: { $gte: 2 },
      isMentorAvailable: false,
    });

    const pendingRequests = await Mentorship.countDocuments({ status: "Pending" });
    const acceptedMentorships = await Mentorship.countDocuments({ status: "Accepted" });

    const totalChats = await Message.aggregate([
      {
        $group: {
          _id: {
            $cond: [
              { $gt: ["$senderId", "$receiverId"] },
              { s1: "$senderId", s2: "$receiverId" },
              { s1: "$receiverId", s2: "$senderId" },
            ],
          },
        },
      },
      { $count: "count" },
    ]);
    const activeChatsCount = totalChats.length > 0 ? totalChats[0].count : 0;

    // Get top mentors by accepted requests
    const topMentors = await Mentorship.aggregate([
      { $match: { status: "Accepted" } },
      { $group: { _id: "$seniorId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      {
        $project: {
          _id: 1,
          count: 1,
          name: "$user.name",
          branch: "$user.branch",
          year: "$user.year",
          profileImage: "$user.profileImage",
        },
      },
    ]);

    res.json({
      totalSeniors,
      activeMentors,
      inactiveSeniors,
      pendingRequests,
      acceptedMentorships,
      activeChats: activeChatsCount,
      topMentors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// EVENT MANAGEMENT APIs (University Updates)
// ==========================================

const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      eventDate,
      eventTime,
      eventType,
      organizedBy,
      bannerImage,
      registrationLink,
      websiteLink,
      moreDetailsLink,
    } = req.body;

    const event = await Event.create({
      title,
      description,
      eventDate,
      eventTime,
      eventType,
      organizedBy,
      bannerImage,
      registrationLink,
      websiteLink,
      moreDetailsLink,
      createdBy: req.user._id,
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    await event.deleteOne();
    res.json({ message: "Event removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};
