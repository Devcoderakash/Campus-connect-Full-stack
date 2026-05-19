const Mentorship = require("../models/Mentorship");
const Notification = require("../models/Notification");
const User = require("../models/User");

const requestMentorship = async (req, res) => {
  try {
    const { seniorId, requestMessage } = req.body;

    const senior = await User.findById(seniorId);
    const currentUserYear = req.user.year || 1;
    const seniorYear = senior?.year || 1;

    if (!senior) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!["senior", "Senior"].includes(senior.role) || senior.verificationStatus !== "approved") {
      return res.status(403).json({ message: "Mentorship can only be requested from verified, approved seniors" });
    }

    if (seniorYear <= currentUserYear) {
      return res
        .status(403)
        .json({ message: "Can only request mentorship from someone in a higher year" });
    }

    const existingRequest = await Mentorship.findOne({
      juniorId: req.user._id,
      seniorId,
    });

    if (existingRequest) {
      return res.status(400).json({ message: "Mentorship request already sent" });
    }

    const mentorship = await Mentorship.create({
      juniorId: req.user._id,
      seniorId,
      requestMessage,
    });

    const notification = await Notification.create({
      userId: seniorId,
      title: "New Mentorship Request",
      message: `${req.user.name} has requested mentorship`,
      type: "mentorship",
      relatedId: mentorship._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(seniorId.toString()).emit("receiveNotification", notification);
    }

    res.status(201).json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMentorshipRequests = async (req, res) => {
  try {
    // INCOMING requests: where the current user is the requested mentor
    const query = { seniorId: req.user._id };

    const requests = await Mentorship.find(query)
      .populate("juniorId", "name branch year profileImage")
      .populate("seniorId", "name branch year profileImage")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /mentorship/my-requests
 * Returns all mentorship requests the current user has SENT (outgoing).
 * Used by the Seniors page to know which mentor cards should show "Requested".
 */
const getMySentRequests = async (req, res) => {
  try {
    const requests = await Mentorship.find({ juniorId: req.user._id })
      .populate("seniorId", "name _id")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateMentorshipStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const mentorship = await Mentorship.findById(req.params.id);

    if (!mentorship) {
      return res.status(404).json({ message: "Mentorship request not found" });
    }

    if (mentorship.seniorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this request" });
    }

    if (!["Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    mentorship.status = status;
    await mentorship.save();

    const notification = await Notification.create({
      userId: mentorship.juniorId,
      title: `Mentorship ${status}`,
      message: `Your mentorship request to ${req.user.name} was ${status.toLowerCase()}`,
      type: "mentorship",
      relatedId: mentorship._id,
    });

    const io = req.app.get("io");
    if (io) {
      io.to(mentorship.juniorId.toString()).emit("receiveNotification", notification);
    }

    res.json(mentorship);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSeniors = async (req, res) => {
  try {
    const { branch, year, skills, search, availability } = req.query;

    // Enforce hierarchical mentorship: users can only see people strictly above their year
    const currentUserYear = req.user.year || 1;
    
    // Only verified, approved seniors are shown
    let query = {
      role: { $in: ["senior", "Senior"] },
      verificationStatus: "approved",
      visibility: true,
    };

    if (currentUserYear < 4) {
      query.year = { $gt: currentUserYear };
    } else {
      query.year = { $gte: 4 }; // Show 4th year and alumni
    }

    if (branch && branch !== "All") query.branch = branch;

    // If client specifically selected a year, intersect it with our hierarchy logic
    if (year && year !== "all") {
      const requestedYear = Number(year);
      const isAllowed = currentUserYear < 4 ? requestedYear > currentUserYear : requestedYear >= 4;
      if (isAllowed) {
        query.year = requestedYear;
      } else {
        // If they ask for a year that isn't senior to them, return nothing
        return res.json([]);
      }
    }

    if (availability !== undefined && availability !== "all") {
      query.isMentorAvailable = availability === "true";
    }

    if (skills) query.skills = { $in: skills.split(",") };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { bio: { $regex: search, $options: "i" } },
        { skills: { $regex: search, $options: "i" } },
      ];
    }

    const seniors = await User.find(query).select("-password").sort({ year: 1, name: 1 });
    res.json(seniors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("bookmarkedMentors", "-password");
    res.json(user.bookmarkedMentors || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const toggleBookmark = async (req, res) => {
  try {
    const { seniorId } = req.body;
    const user = await User.findById(req.user._id);

    const index = user.bookmarkedMentors.indexOf(seniorId);
    if (index === -1) {
      user.bookmarkedMentors.push(seniorId);
    } else {
      user.bookmarkedMentors.splice(index, 1);
    }

    await user.save();
    res.json(user.bookmarkedMentors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  requestMentorship,
  getMentorshipRequests,
  getMySentRequests,
  updateMentorshipStatus,
  getSeniors,
  getBookmarks,
  toggleBookmark,
};
