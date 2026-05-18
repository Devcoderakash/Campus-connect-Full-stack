const Message = require("../models/Message");
const Mentorship = require("../models/Mentorship");
const User = require("../models/User");

const getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    // Verify the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate an accepted mentorship exists between these two users
    const mentorship = await Mentorship.findOne({
      $or: [
        { juniorId: currentUserId, seniorId: otherUserId },
        { juniorId: otherUserId, seniorId: currentUserId },
      ],
      status: "Accepted",
    });

    if (!mentorship) {
      return res.status(403).json({ message: "Chat requires an accepted mentorship." });
    }

    const rawMessages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .lean(); // returns plain JS objects, not Mongoose documents

    // Explicitly stringify all ObjectId fields so the frontend always
    // gets a consistent plain string — never an ObjectId instance or BSON wrapper.
    const messages = rawMessages.map((m) => ({
      ...m,
      _id: m._id.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId ? m.receiverId.toString() : null,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    }));

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    const mentorships = await Mentorship.find({
      $or: [{ juniorId: currentUserId }, { seniorId: currentUserId }],
      status: "Accepted",
    })
      .populate("juniorId", "name profileImage _id")
      .populate("seniorId", "name profileImage _id");

    const conversations = await Promise.all(
      mentorships
        .filter((m) => m.juniorId && m.seniorId) // Skip if either side failed to populate
        .map(async (m) => {
          const juniorIdStr = m.juniorId._id.toString();
          const seniorIdStr = m.seniorId._id.toString();

          // The "other" user is whichever side is NOT the current user.
          // Using explicit string comparison against both sides avoids
          // the isCurrentJunior flip-flop bug.
          let otherUser;
          if (juniorIdStr === currentUserId) {
            otherUser = m.seniorId; // current user is junior → other is senior
          } else if (seniorIdStr === currentUserId) {
            otherUser = m.juniorId; // current user is senior → other is junior
          } else {
            return null; // current user not in this mentorship — skip
          }

          const otherUserIdStr = otherUser._id.toString();

          const lastMsg = await Message.findOne({
            $or: [
              { senderId: currentUserId, receiverId: otherUserIdStr },
              { senderId: otherUserIdStr, receiverId: currentUserId },
            ],
          })
            .sort({ createdAt: -1 })
            .lean();

          const unread = await Message.countDocuments({
            senderId: otherUserIdStr,
            receiverId: currentUserId,
            isRead: false,
          });

          return {
            _id: otherUserIdStr,
            name: otherUser.name,
            profileImage: otherUser.profileImage ?? null,
            lastMessage: lastMsg?.message ?? null,
            lastMessageAt: lastMsg?.createdAt ?? m.createdAt,
            unread,
          };
        }),
    );

    const valid = conversations
      .filter(Boolean)
      .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    res.json(valid);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// saveMessage via API is mostly replaced by sockets, but we keep it as fallback
const saveMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;

    const mentorship = await Mentorship.findOne({
      $or: [
        { juniorId: req.user._id, seniorId: receiverId },
        { juniorId: receiverId, seniorId: req.user._id },
      ],
      status: "Accepted",
    });

    if (!mentorship) {
      return res.status(403).json({ message: "Unauthorized: Mentorship must be accepted." });
    }

    const newMessage = await Message.create({
      senderId: req.user._id,
      receiverId,
      message,
    });
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getChatHistory, getConversations, saveMessage };
