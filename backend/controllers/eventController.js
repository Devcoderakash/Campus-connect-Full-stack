const Event = require("../models/Event");

const getEvents = async (req, res) => {
  try {
    const events = await Event.find()
      .populate("createdBy", "name profileImage")
      .sort({ eventDate: 1, eventTime: 1 }); // Sort by upcoming
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getEvents,
};
