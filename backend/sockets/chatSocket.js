const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Conversation = require("../models/Conversation");

// userId (string) -> Set of socketIds
const onlineUsers = new Map();

module.exports = (io) => {
  // Socket.io Auth Middleware
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

    // Join personal room for direct events
    socket.join(myId);

    // Track online presence
    if (!onlineUsers.has(myId)) onlineUsers.set(myId, new Set());
    onlineUsers.get(myId).add(socket.id);
    io.emit("onlineUsers", Array.from(onlineUsers.keys()));

    // ── joinChat ───────────────────────────────────────────────────────────
    socket.on("joinChat", async ({ conversationId }) => {
      try {
        if (!conversationId) return;
        socket.join(conversationId);
        console.log(`[Socket] ${socket.user.name} joined room ${conversationId}`);
      } catch (err) {
        console.error("[Socket] joinChat error:", err.message);
      }
    });

    // ── Typing indicators ──────────────────────────────────────────────────
    socket.on("typing", ({ conversationId }) => {
      try {
        if (conversationId) {
          socket.to(conversationId).emit("typing", { senderId: myId });
        }
      } catch (err) {
        console.error("[Socket] Typing error:", err.message);
      }
    });

    socket.on("stopTyping", ({ conversationId }) => {
      try {
        if (conversationId) {
          socket.to(conversationId).emit("stopTyping", { senderId: myId });
        }
      } catch (err) {
        console.error("[Socket] StopTyping error:", err.message);
      }
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
