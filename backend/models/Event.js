const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    eventDate: { type: Date, required: true },
    eventTime: { type: String, required: true },
    eventType: {
      type: String,
      required: true,
      enum: [
        "Hackathon",
        "Workshop",
        "Seminar",
        "Placement Drive",
        "Exam Notice",
        "Cultural Event",
        "University Announcement",
      ],
    },
    organizedBy: { type: String, required: true },
    bannerImage: { type: String },
    registrationLink: { type: String },
    websiteLink: { type: String },
    moreDetailsLink: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Event", eventSchema);
