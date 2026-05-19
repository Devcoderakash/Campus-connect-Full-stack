const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");

// Initialise the Google OAuth2 client.
// Used both for verifying ID tokens (One Tap / button flow) and for
// making userinfo requests (implicit access_token flow).
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * POST /api/auth/google-login
 *
 * Supports two modes depending on what the frontend sends:
 *
 *  Mode A — ID token (One Tap / GoogleLogin button):
 *    Body: { credential: "<google_id_token>" }
 *    Verifies the JWT with verifyIdToken, extracts payload.
 *
 *  Mode B — Access token / userinfo profile (useGoogleLogin implicit flow):
 *    Body: { googleProfile: { sub, name, email, picture } }
 *    The frontend already exchanged the access_token for profile data via
 *    Google's userinfo endpoint. We trust it and upsert the user.
 *
 * Both modes produce the same result: a 7-day JWT + user object.
 */
const googleLogin = async (req, res) => {
  const { credential, googleProfile } = req.body;

  // ── 1. Validate: we need exactly one of the two modes ───────────────────
  if (!credential && !googleProfile) {
    return res
      .status(400)
      .json({ message: "Provide either a Google credential token or a googleProfile object" });
  }

  try {
    let googleId, name, email, profileImage;

    if (credential) {
      // ── Mode A: verify the Google ID token ──────────────────────────────
      // verifyIdToken checks signature, expiry, and audience.
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      ({ sub: googleId, name, email, picture: profileImage } = payload);
    } else {
      // ── Mode B: trust the pre-fetched Google profile ────────────────────
      // The frontend already verified this via Google's userinfo API.
      ({ sub: googleId, name, email, picture: profileImage } = googleProfile);

      if (!googleId || !email) {
        return res.status(400).json({ message: "Invalid Google profile data" });
      }
    }

    // ── 2. Find or create the user ──────────────────────────────────────────
    // Check both googleId and email to handle existing email/password accounts
    // that want to link their Google identity.
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Patch any missing Google fields (e.g. user previously signed up with email)
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (!user.profileImage && profileImage) {
        user.profileImage = profileImage;
        updated = true;
      }
      if (updated) await user.save();
    } else {
      // First time sign-in — create a minimal account.
      // branch and year are intentionally left as defaults; the user fills
      // them in from their profile settings page.
      user = await User.create({
        googleId,
        name,
        email,
        profileImage,
        role: "junior",
        verificationStatus: "none",
        verifiedBadge: false,
        branch: "",
        year: 1,
        skills: [],
      });
    }

    // ── 3. Issue a 7-day JWT ────────────────────────────────────────────────
    const token = generateToken(user._id, user.role);

    // ── 4. Return token + safe user object ─────────────────────────────────
    return res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        branch: user.branch,
        year: user.year,
        skills: user.skills,
        bio: user.bio || "",
        verificationStatus: user.verificationStatus || "none",
        collegeIdUrl: user.collegeIdUrl || "",
        verifiedBadge: user.verifiedBadge || false,
        github: user.github || "",
        linkedin: user.linkedin || "",
        portfolio: user.portfolio || "",
      },
    });
  } catch (error) {
    console.error("[Google Auth Error]", error.message);

    // Distinguish a bad token from a server-side failure
    if (
      error.message?.includes("Token used too late") ||
      error.message?.includes("Invalid token signature") ||
      error.message?.includes("Wrong number of segments")
    ) {
      return res.status(401).json({ message: "Invalid or expired Google token" });
    }

    return res.status(500).json({ message: "Google authentication failed" });
  }
};

module.exports = { googleLogin };
