const User = require("../models/User");
const Resource = require("../models/Resource");
const Mentorship = require("../models/Mentorship");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.bio = req.body.bio || user.bio;
      user.contact = req.body.contact || user.contact;
      user.skills = req.body.skills || user.skills;
      const {
        name,
        bio,
        skills,
        github,
        linkedin,
        portfolio,
        leetcode,
        codechef,
        hackerrank,
        twitter,
      } = req.body;
      let profileImage = user.profileImage;
      if (req.body.branch) user.branch = req.body.branch;
      if (req.body.year) user.year = Number(req.body.year);
      if (github !== undefined) user.github = github;
      if (linkedin !== undefined) user.linkedin = linkedin;
      if (portfolio !== undefined) user.portfolio = portfolio;
      if (leetcode !== undefined) user.leetcode = leetcode;
      if (codechef !== undefined) user.codechef = codechef;
      if (hackerrank !== undefined) user.hackerrank = hackerrank;
      if (twitter !== undefined) user.twitter = twitter;
      user.profileImage = req.body.profileImage || user.profileImage;
      if (req.body.visibility !== undefined) user.visibility = req.body.visibility;
      if (req.body.isMentorAvailable !== undefined)
        user.isMentorAvailable = req.body.isMentorAvailable;

      if (req.body.password) {
        const bcrypt = require("bcryptjs");
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        bio: updatedUser.bio,
        contact: updatedUser.contact,
        skills: updatedUser.skills,
        profileImage: updatedUser.profileImage,
        visibility: updatedUser.visibility,
        isMentorAvailable: updatedUser.isMentorAvailable,
        branch: updatedUser.branch,
        year: updatedUser.year,
        github: updatedUser.github,
        linkedin: updatedUser.linkedin,
        portfolio: updatedUser.portfolio,
        leetcode: updatedUser.leetcode,
        codechef: updatedUser.codechef,
        hackerrank: updatedUser.hackerrank,
        twitter: updatedUser.twitter,
      });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchUsers = async (req, res) => {
  try {
    const keyword = req.query.keyword
      ? {
          $or: [
            { name: { $regex: req.query.keyword, $options: "i" } },
            { branch: { $regex: req.query.keyword, $options: "i" } },
          ],
        }
      : {};

    const users = await User.find({ ...keyword, visibility: true }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSeniors = async (req, res) => {
  try {
    const { branch, skill, keyword, year, isMentorAvailable } = req.query;

    // Core hierarchy logic: Only show users strictly senior (higher year) than the current user.
    // E.g., if user is Year 2, show Year 3 and 4.
    const currentYear = req.user.year || 1;
    let query = {
      year: { $gt: currentYear },
      visibility: true,
    };

    if (branch) query.branch = branch;
    if (skill) query.skills = { $in: [skill] };
    if (year) query.year = Number(year); // If they explicitly filter by a specific valid senior year
    if (isMentorAvailable === "true") query.isMentorAvailable = true;

    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: "i" } },
        { branch: { $regex: keyword, $options: "i" } },
        { skills: { $regex: keyword, $options: "i" } },
      ];
    }

    const seniors = await User.find(query).select("-password").sort({ year: 1 });
    res.json(seniors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfileStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // 1. Resources & Uploads Count
    const resourcesCount = await Resource.countDocuments({ uploadedBy: userId });

    // Total uploads is equivalent to resourcesCount for now, unless we distinguish resource types
    const uploadsCount = resourcesCount;

    // 2. Connections Count (Accepted mentorships where user is senior or junior)
    const connectionsCount = await Mentorship.countDocuments({
      $or: [{ seniorId: userId }, { juniorId: userId }],
      status: "Accepted",
    });

    // 3. Bookmarks Count (bookmarked mentors)
    const user = await User.findById(userId).select("bookmarkedMentors mentorStats");
    const bookmarksCount = user?.bookmarkedMentors?.length || 0;

    res.json({
      resourcesCount,
      uploadsCount,
      connectionsCount,
      bookmarksCount,
      activeChats: user?.mentorStats?.activeChats || 0,
      totalRequests: user?.mentorStats?.totalRequests || 0,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile, searchUsers, getSeniors, getProfileStats };
