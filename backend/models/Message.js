const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    text: { type: String, required: true },
    message: { type: String }, // For backwards compatibility
    seen: { type: Boolean, default: false },
    delivered: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
);

// Populate 'message' fallback with 'text' before saving
messageSchema.pre("save", function (next) {
  if (this.text && !this.message) {
    this.message = this.text;
  }
  next();
});

module.exports = mongoose.model("Message", messageSchema);
