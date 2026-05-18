const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Mentorship = require("../models/Mentorship");
const Message = require("../models/Message");
const Notification = require("../models/Notification");

// userId (string) -> Set of socketIds
const onlineUsers = new Map();

/**
 * Build a deterministic room name for a pair of users.
 * Sorting guarantees the same room regardless of who initiated.
 */
const roomFor = (idA, idB) => [String(idA), String(idB)].sort().join("_");

/** Serialise a saved Mongoose Message doc to a plain, frontend-safe object */
const toPlain = (doc, senderId, receiverId) => ({
  _id: doc._id.toString(),
  senderId: String(senderId),
  receiverId: String(receiverId),
  message: doc.message,
  createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
  isRead: doc.isRead,
});

module.exports = (io) => {
  // ── Socket.io Auth Middleware ────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication error: No token"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("Authentication error: User not found"));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const myId = socket.user._id.toString();
    console.log(`[Socket] Connected: ${socket.user.name} (${myId})`);

    // Each user always joins their own personal room so they can receive
    // notifications and messages even before opening a specific chat.
    socket.join(myId);

    // Track online presence
    if (!onlineUsers.has(myId)) onlineUsers.set(myId, new Set());
    onlineUsers.get(myId).add(socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // ── joinChat ───────────────────────────────────────────────────────────
    // The client calls this when it opens a conversation.
    // We validate the mentorship ONCE here and let the socket join the room.
    socket.on("joinChat", async ({ otherUserId }) => {
      try {
        const otherId = String(otherUserId);

        // Validate accepted mentorship
        const mentorship = await Mentorship.findOne({
          $or: [
            { juniorId: myId, seniorId: otherId },
            { juniorId: otherId, seniorId: myId },
          ],
          status: "Accepted",
        });

        if (!mentorship) {
          return socket.emit("chatError", "Chat requires an accepted mentorship.");
        }

        const room = roomFor(myId, otherId);
        socket.join(room);
        // Mark all unread messages in this conversation as read
        await Message.updateMany(
          { senderId: otherId, receiverId: myId, isRead: false },
          { $set: { isRead: true } },
        );
        socket.emit("joinedChat", { room, otherUserId: otherId });
        console.log(`[Socket] ${socket.user.name} joined room ${room}`);
      } catch (err) {
        console.error("[Socket] joinChat error:", err.message);
        socket.emit("chatError", "Failed to join chat.");
      }
    });

    // ── sendMessage ────────────────────────────────────────────────────────
    socket.on("sendMessage", async ({ receiverId, message }) => {
      try {
        const senderId = myId;
        const receiverIdStr = String(receiverId);

        if (!message?.trim()) return;

        // Save to MongoDB
        const saved = await Message.create({
          senderId,
          receiverId: receiverIdStr,
          message: message.trim(),
        });

        const plain = toPlain(saved, senderId, receiverIdStr);
        const room = roomFor(senderId, receiverIdStr);

        // Emit to the shared chat room (both users if both have joined)
        io.to(room).emit("receiveMessage", plain);

        // CRITICAL: also emit directly to receiver's personal room in case
        // they haven't called joinChat yet (e.g., chat not currently open).
        // This ensures the receiver always gets the message in real-time.
        io.to(receiverIdStr).emit("receiveMessage", plain);

        // Offline notification
        if (!onlineUsers.has(receiverIdStr) || onlineUsers.get(receiverIdStr).size === 0) {
          const notif = await Notification.create({
            userId: receiverIdStr,
            title: "New Message",
            message: `New message from ${socket.user.name}`,
            type: "message",
            relatedId: senderId,
          });
          io.to(receiverIdStr).emit("receiveNotification", toPlain(notif, senderId, receiverIdStr));
        }

        console.log(`[Socket] Message: ${socket.user.name} → ${receiverIdStr}`);
      } catch (err) {
        console.error("[Socket] sendMessage error:", err.message);
        socket.emit("chatError", "Failed to send message.");
      }
    });

    // ── Typing indicators ──────────────────────────────────────────────────
    socket.on("typing", ({ receiverId }) => {
      const room = roomFor(myId, String(receiverId));
      socket.to(room).emit("typing", { senderId: myId });
      // Also emit to personal room
      socket.to(String(receiverId)).emit("typing", { senderId: myId });
    });

    socket.on("stopTyping", ({ receiverId }) => {
      const room = roomFor(myId, String(receiverId));
      socket.to(room).emit("stopTyping", { senderId: myId });
      socket.to(String(receiverId)).emit("stopTyping", { senderId: myId });
    });

    // ── Disconnect ─────────────────────────────────────────────────────────
    socket.on("disconnect", () => {
      const userSockets = onlineUsers.get(myId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) onlineUsers.delete(myId);
      }
      io.emit("onlineUsers", Array.from(onlineUsers.keys()));
      console.log(`[Socket] Disconnected: ${socket.user.name}`);
    });
  });
};
