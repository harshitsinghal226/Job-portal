import express from 'express';
import {
  applyForJob,
  getUserData,
  getUserJobApplications,
  updateUserResume
} from '../controllers/userController.js';

import { uploadPDF } from '../config/multer.js';
import { protectUser } from '../middleware/clerkMiddleware.js';
import { clerk } from '../config/clerk.js';
import { User } from '../models/index.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

const router = express.Router();

// Handler function for user sync
const handleUserSync = async (req, res) => {
  const clerkUserId = req.auth?.userId;
  const { email, firstName, lastName } = req.body;

  if (!clerkUserId) {
    res.status(401).json({
      success: false,
      message: "No user ID provided in auth"
    });
    return;
  }

  if (!email) {
    res.status(400).json({
      success: false,
      message: "Email is required"
    });
    return;
  }

  try {
    // First try to find user by clerkId
    let user = await User.findOne({ clerkId: clerkUserId });

    if (user) {
      // Update existing user
      user.email = email;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.lastUpdated = new Date();
      await user.save();

      res.json({
        success: true,
        message: "User updated",
        user,
        action: "updated"
      });
      return;
    }

    // Check if email already exists with a different clerkId
    const existingUserWithEmail = await User.findOne({ email });
    if (existingUserWithEmail) {
      // Check if the existing user has a different clerkId
      if (existingUserWithEmail.clerkId !== clerkUserId) {
        res.status(409).json({
          success: false,
          message: "Email already registered with a different account",
          details: "This email is associated with another user account",
          suggestion: "Please use a different email address or contact support to resolve this conflict",
          existingUserId: existingUserWithEmail._id
        });
        return;
      }
    }

    // Create new user if not exists
    user = new User({
      clerkId: clerkUserId,
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      resume: "",
      createdAt: new Date(),
      lastUpdated: new Date()
    });

    await user.save();

    res.json({
      success: true,
      message: "User created",
      user,
      action: "created"
    });
  } catch (err) {
    console.error("❌ Sync user error:", err);

    // Handle any other MongoDB errors
    if (err.code === 11000) {
      res.status(409).json({
        success: false,
        message: "User already exists",
        details: "A user with this clerkId or email already exists",
        conflict: err.keyValue
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: err.message || "Error syncing user"
    });
  }
};

// Routes - sync endpoint needs ClerkExpressWithAuth
router.post("/sync", ClerkExpressWithAuth({
  authorizedParties: ['https://job-portal-q3rr.vercel.app', 'https://job-portal-2gry.onrender.com']
}), handleUserSync);

// Protect all routes after this middleware (except sync which is above)
router.use(protectUser);

// Get user profile data
router.get('/data', getUserData);

// Get user profile with auth (alternate endpoint)
router.get('/user', getUserData);

// Apply for a job (accept optional resume PDF upload)
router.post('/apply-job', uploadPDF, applyForJob);

// Get user's job applications
router.get('/applications', getUserJobApplications);

// Update user's resume
router.post('/update-resume', uploadPDF, updateUserResume);

// Update user email (for conflict resolution)
router.post('/update-email', async (req, res) => {
  try {
    const { newEmail } = req.body;
    const clerkUserId = req.auth?.userId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    if (!newEmail) {
      return res.status(400).json({
        success: false,
        message: "New email is required"
      });
    }

    // Check if new email already exists
    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser && existingUser.clerkId !== clerkUserId) {
      return res.status(409).json({
        success: false,
        message: "Email already in use by another account"
      });
    }

    // Update user's email
    const user = await User.findOneAndUpdate(
      { clerkId: clerkUserId },
      {
        email: newEmail,
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    res.json({
      success: true,
      message: "Email updated successfully",
      user
    });
  } catch (error) {
    console.error("❌ Error updating email:", error);
    res.status(500).json({
      success: false,
      message: "Error updating email"
    });
  }
});

export default router;
