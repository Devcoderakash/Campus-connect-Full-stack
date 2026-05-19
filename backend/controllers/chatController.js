const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const Mentorship = require("../models/Mentorship");
const User = require("../models/User");
const Notification = require("../models/Notification");

/** Serialise a saved Mongoose Message doc to a plain, frontend-safe object */
const toPlain = (doc) => ({
  _id: doc._id.toString(),
  senderId: doc.senderId.toString(),
  receiverId: doc.receiverId.toString(),
  conversationId: doc.conversationId.toString(),
  message: doc.text || doc.message, // Support both fields
  text: doc.text,
  createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  seen: doc.seen,
  delivered: doc.delivered,
});

/**
 * GET /api/chat/conversations
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

          let otherUser = juniorIdStr === currentUserId ? m.seniorId : m.juniorId;
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
            _id: otherUserIdStr,
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
 * GET /api/chat/messages/:conversationId
 * Fetch full chat history by conversation ID
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id.toString();

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(currentUserId)) {
      return res.status(403).json({ message: "Not a participant of this conversation" });
    }

    // Fetch messages
    const rawMessages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    const messages = rawMessages.map((m) => ({
      ...m,
      _id: m._id.toString(),
      senderId: m.senderId.toString(),
      receiverId: m.receiverId.toString(),
      conversationId: m.conversationId.toString(),
      message: m.text || m.message,
      createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt,
    }));

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * POST /api/chat/send
 * Sends a message, saves to DB, emits over socket
 */
const sendMessage = async (req, res) => {
  try {
    const { receiverId, message } = req.body;
    const currentUserId = req.user._id.toString();
    const io = req.app.get("io");

    if (!message || !message.trim()) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    // Ensure users have an accepted mentorship
    const mentorship = await Mentorship.findOne({
      $or: [
        { juniorId: currentUserId, seniorId: receiverId },
        { juniorId: receiverId, seniorId: currentUserId },
      ],
      status: "Accepted",
    });

    if (!mentorship) {
      return res.status(403).json({ message: "Chat requires an accepted mentorship." });
    }

    // Find or create conversation
    let conversation = await Conversation.findOne({
      participants: { $all: [currentUserId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [currentUserId, receiverId],
        unreadCount: new Map([
          [currentUserId, 0],
          [receiverId, 0],
        ]),
      });
    }

    // Save message to database
    const savedMsg = await Message.create({
      senderId: currentUserId,
      receiverId,
      conversationId: conversation._id,
      text: message.trim(),
      message: message.trim(),
    });

    // Update conversation last message & unread counts
    conversation.lastMessage = message.trim();
    conversation.lastMessageTime = savedMsg.createdAt;
    
    const currentUnread = conversation.unreadCount.get(receiverId) || 0;
    conversation.unreadCount.set(receiverId, currentUnread + 1);
    await conversation.save();

    const plainMsg = toPlain(savedMsg);
    const room = conversation._id.toString();

    // Emit over socket
    if (io) {
      io.to(room).emit("receiveMessage", plainMsg);
      io.to(receiverId).emit("receiveMessage", plainMsg);

      // Offline notification fallback check
      const receiverSockets = io.sockets.adapter.rooms.get(receiverId);
      if (!receiverSockets || receiverSockets.size === 0) {
        // User is fully offline, queue a notification
        const notif = await Notification.create({
          userId: receiverId,
          title: "New Message",
          message: `You received a new message.`,
          type: "message",
          relatedId: currentUserId,
        });
        io.to(receiverId).emit("receiveNotification", notif);
      }
    }

    res.status(201).json(plainMsg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/chat/seen/:conversationId
 * Marks messages as seen in a conversation
 */
const markSeen = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id.toString();
    const io = req.app.get("io");

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!conversation.participants.includes(currentUserId)) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Mark messages as seen
    await Message.updateMany(
      { conversationId: conversation._id, receiverId: currentUserId, seen: false },
      { $set: { seen: true } },
    );

    // Reset unread count
    conversation.unreadCount.set(currentUserId, 0);
    await conversation.save();

    if (io) {
      io.to(conversationId).emit("messagesSeen", {
        conversationId,
        seenBy: currentUserId,
      });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  markSeen,
};
