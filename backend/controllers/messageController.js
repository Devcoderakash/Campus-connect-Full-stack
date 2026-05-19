const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Mentorship = require("../models/Mentorship");
const User = require("../models/User");

/**
 * GET /messages/:userId
 * Retrieves full chat history between current user and other user.
 * Marks all incoming messages from other user in this conversation as seen.
 */
const getChatHistory = async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    // Verify other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Validate accepted mentorship exists between these two users
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

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, otherUserId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, otherUserId],
        unreadCount: new Map([
          [currentUserId.toString(), 0],
          [otherUserId.toString(), 0],
        ]),
      });
    }

    // Mark messages from other user as seen
    await Message.updateMany(
      { conversationId: conversation._id, receiverId: currentUserId, seen: false },
      { $set: { seen: true } },
    );

    // Reset unread count for current user
    conversation.unreadCount.set(currentUserId.toString(), 0);
    await conversation.save();

    // Fetch messages
    const rawMessages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean();

    const messages = rawMessages.map((m) => ({
      ...m,
      _id: m._id.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      conversationId: m.conversationId.toString(),
      message: m.text || m.message, // Fallback for frontend compatibility
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    }));

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /messages/conversations
 * Returns conversations for active mentorships.
 */
const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user._id.toString();

    // 1. Get all accepted mentorships
    const mentorships = await Mentorship.find({
      $or: [{ juniorId: currentUserId }, { seniorId: currentUserId }],
      status: "Accepted",
    })
      .populate("juniorId", "name profileImage _id role verifiedBadge")
      .populate("seniorId", "name profileImage _id role verifiedBadge");

    const conversations = await Promise.all(
      mentorships
        .filter((m) => m.juniorId && m.seniorId)
        .map(async (m) => {
          const juniorIdStr = m.juniorId._id.toString();
          const seniorIdStr = m.seniorId._id.toString();

          let otherUser;
          if (juniorIdStr === currentUserId) {
            otherUser = m.seniorId;
          } else if (seniorIdStr === currentUserId) {
            otherUser = m.juniorId;
          } else {
            return null;
          }

          const otherUserIdStr = otherUser._id.toString();

          // Find or create conversation
          let conversation = await Conversation.findOne({
            participants: { $all: [currentUserId, otherUserIdStr] },
          });

          if (!conversation) {
            conversation = await Conversation.create({
              participants: [currentUserId, otherUserIdStr],
              unreadCount: new Map([
                [currentUserId, 0],
                [otherUserIdStr, 0],
              ]),
            });
          }

          // Fetch the true last message
          const lastMsg = await Message.findOne({ conversationId: conversation._id })
            .sort({ createdAt: -1 })
            .lean();

          if (lastMsg) {
            conversation.lastMessage = lastMsg.text || lastMsg.message;
            conversation.lastMessageTime = lastMsg.createdAt;
            await conversation.save();
          }

          const unread = conversation.unreadCount.get(currentUserId) || 0;

          return {
            _id: otherUserIdStr, // Frontend identifies conversation by the other participant's ID
            conversationId: conversation._id.toString(),
            name: otherUser.name,
            profileImage: otherUser.profileImage ?? null,
            role: otherUser.role,
            verifiedBadge: otherUser.verifiedBadge ?? false,
            lastMessage: conversation.lastMessage || null,
            lastMessageAt: conversation.lastMessageTime || m.createdAt,
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

/**
 * POST /messages
 * Fallback REST API for sending messages.
 */
const saveMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const currentUserId = req.user._id;

    const mentorship = await Mentorship.findOne({
      $or: [
        { juniorId: currentUserId, seniorId: receiverId },
        { juniorId: receiverId, seniorId: currentUserId },
      ],
      status: "Accepted",
    });

    if (!mentorship) {
      return res.status(403).json({ message: "Unauthorized: Mentorship must be accepted." });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, receiverId],
        unreadCount: new Map([
          [currentUserId.toString(), 0],
          [receiverId.toString(), 0],
        ]),
      });
    }

    // Save message
    const newMessage = await Message.create({
      senderId: currentUserId,
      receiverId,
      conversationId: conversation._id,
      text: message.trim(),
    });

    // Update conversation state
    conversation.lastMessage = message.trim();
    conversation.lastMessageTime = newMessage.createdAt;
    
    const currentUnread = conversation.unreadCount.get(receiverId.toString()) || 0;
    conversation.unreadCount.set(receiverId.toString(), currentUnread + 1);
    await conversation.save();

    res.status(201).json({
      ...newMessage.toObject(),
      message: newMessage.text, // Backwards compatibility
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getChatHistory, getConversations, saveMessage };
