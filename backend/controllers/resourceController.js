const Resource = require("../models/Resource");
const Notification = require("../models/Notification");
const User = require("../models/User");
const drive = require("../config/googleDrive");
const stream = require("stream");

const getResources = async (req, res) => {
  try {
    const {
      subject,
      branch,
      semester,
      year,
      unit,
      type,
      keyword,
      page = 1,
      limit = 10,
    } = req.query;

    let query = {};
    if (subject) query.subject = { $regex: subject, $options: "i" };
    if (branch && branch !== "All") query.branch = branch;
    if (semester && semester !== "all") query.semester = semester;
    if (year && year !== "all") query.year = year;
    if (unit && unit !== "All") query.unit = unit;
    if (type && type !== "All") query.resourceType = type;
    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { description: { $regex: keyword, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const resources = await Resource.find(query)
      .populate("uploadedBy", "name role profileImage")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Resource.countDocuments(query);

    res.json({
      resources,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const uploadResource = async (req, res) => {
  try {
    const { title, description, subject, branch, semester, year, unit, resourceType } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Convert buffer to stream for Google Drive
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Upload to Google Drive
    const fileMetadata = {
      name: req.file.originalname,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };
    const media = {
      mimeType: req.file.mimetype,
      body: bufferStream,
    };

    const driveResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: "id, webViewLink",
    });

    const fileId = driveResponse.data.id;

    // Make file public
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    const fileUrl = driveResponse.data.webViewLink;

    const resource = await Resource.create({
      title,
      description,
      subject,
      branch,
      semester,
      year: year || Math.ceil(semester / 2) || 1,
      unit: unit || "All",
      resourceType,
      fileUrl: fileUrl,
      fileId: fileId,
      mimeType: req.file.mimetype,
      fileName: req.file.originalname,
      uploadedBy: req.user._id,
    });

    const usersToNotify = await User.find({
      branch,
      year: Math.ceil(semester / 2),
      _id: { $ne: req.user._id },
    });

    const notifications = usersToNotify.map((user) => ({
      userId: user._id,
      title: req.user.role === "Admin" ? "New Resource from Admin" : "New Resource Uploaded",
      message:
        req.user.role === "Admin"
          ? `New ${resourceType} for ${subject} uploaded by Admin`
          : `New ${resourceType} uploaded for ${subject}`,
      type: "resource",
      relatedId: resource._id,
    }));

    if (notifications.length > 0) {
      const inserted = await Notification.insertMany(notifications);
      const io = req.app.get("io");
      if (io) {
        inserted.forEach((notif) => {
          io.to(notif.userId.toString()).emit("receiveNotification", notif);
        });
      }
    }

    res.status(201).json(resource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (resource.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to update this resource" });
    }

    const { title, description, subject, branch, semester, resourceType } = req.body;

    resource.title = title || resource.title;
    resource.description = description || resource.description;
    resource.subject = subject || resource.subject;
    resource.branch = branch || resource.branch;
    resource.semester = semester || resource.semester;
    resource.resourceType = resourceType || resource.resourceType;

    if (req.file) {
      resource.fileUrl = req.file.path;
    }

    const updatedResource = await resource.save();
    res.json(updatedResource);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({ message: "Resource not found" });
    }

    if (resource.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== "Admin") {
      return res.status(403).json({ message: "Not authorized to delete this resource" });
    }

    // Delete from Google Drive if fileId exists
    if (resource.fileId) {
      try {
        await drive.files.delete({
          fileId: resource.fileId,
        });
      } catch (driveError) {
        console.error("Error deleting file from Google Drive:", driveError.message);
        // Continue to delete resource from MongoDB even if Drive delete fails
      }
    }

    await resource.deleteOne();
    res.json({ message: "Resource removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getResources, uploadResource, updateResource, deleteResource };
