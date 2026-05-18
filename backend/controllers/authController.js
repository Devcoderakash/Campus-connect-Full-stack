const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const bcrypt = require("bcryptjs");
const z = require("zod");

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  branch: z.string(),
  year: z.number().int().min(1).max(5),
  role: z.enum(["Junior", "Senior", "Admin"]).optional(),
  skills: z.array(z.string()).optional(),
});

const signup = async (req, res) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation error", errors: parsed.error.errors });
    }

    const { name, email: rawEmail, password, branch, year, role, skills } = parsed.data;
    const email = rawEmail.toLowerCase();

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      branch,
      year,
      role: role || "Junior",
      skills: role === "Senior" ? skills : [],
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        year: user.year,
        skills: user.skills,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email already exists" });
    }
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation failed in database", error: error.message });
    }
    res.status(500).json({ message: "Server error: " + error.message });
  }
};

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const login = async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "Validation error", errors: parsed.error.errors });
    }

    const { email: rawEmail, password } = parsed.data;
    const email = rawEmail.toLowerCase();

    // --- ADMIN BYPASS INJECTION ---
    const adminEmail = process.env.ADMIN_EMAIL || "admin@gmail";
    const adminPass = process.env.ADMIN_PASSWORD || "akash1122";

    if (email === adminEmail && password === adminPass) {
      let adminUser = await User.findOne({ email: adminEmail });
      if (!adminUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPass, salt);
        adminUser = await User.create({
          name: "Super Admin",
          email: adminEmail,
          password: hashedPassword,
          role: "Admin",
          branch: "All",
          year: 4,
          skills: ["System Admin"],
        });
      }
      return res.json({
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        branch: adminUser.branch,
        year: adminUser.year,
        skills: adminUser.skills,
        token: generateToken(adminUser._id, adminUser.role),
      });
    }
    // ------------------------------

    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
        year: user.year,
        skills: user.skills,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { signup, login };
