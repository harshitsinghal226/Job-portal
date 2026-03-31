import { User } from "../models/index.js";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplications.js";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { isMongoConnected } from "../config/db.js";

const handleInMemoryData = (operation, data = null) => {
  if (!global.inMemoryData) {
    global.inMemoryData = {
      jobs: [],
      companies: [],
      users: [],
      applications: []
    };
  }

  switch (operation) {
    case 'findJobById':
      return global.inMemoryData.jobs.find(job => job._id === data.jobId);

    case 'createApplication':
      const newApp = {
        _id: Date.now().toString(),
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      global.inMemoryData.applications.push(newApp);
      return newApp;

    case 'findApplicationByUserAndJob':
      return global.inMemoryData.applications.find(app =>
        app.userId === data.userId && app.jobId === data.jobId
      );

    case 'findApplicationsByUser':
      return global.inMemoryData.applications.filter(app =>
        app.userId === data.userId || app.email === data.userEmail
      );

    case 'updateUserResume':
      const user = global.inMemoryData.users.find(u => u._id === data.userId);
      if (user) {
        user.resume = data.resumeUrl;
        user.lastUpdated = new Date();
        return user;
      }
      return null;

    default:
      return null;
  }
};

export const getUserData = async (req, res) => {
  try {
    // Check if user is authenticated (ClerkExpressWithAuth sets req.auth.userId)
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Login required"
      });
    }

    // Find user in database using clerkId
    let user;
    if (isMongoConnected()) {
      user = await User.findOne({ clerkId: req.auth.userId });
    } else {
      user = global.inMemoryData.users.find(u => u.clerkId === req.auth.userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found. Please complete your profile setup."
      });
    }

    return res.json({
      success: true,
      user: user
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error getting user data",
      error: error.message
    });
  }
};

export const applyForJob = async (req, res) => {
  try {
    // Check if user is authenticated (ClerkExpressWithAuth sets req.auth.userId)
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Login required to apply for jobs"
      });
    }

    const { jobId, coverLetter } = req.body;
    const clerkUserId = req.auth.userId;
    const resumeFile = req.file; // Get the uploaded resume file

    if (!jobId) {
      return res.status(400).json({ success: false, message: "Job ID is required" });
    }

    // Find user in database using clerkId
    let user;
    try {
      if (isMongoConnected()) {
        user = await User.findOne({ clerkId: clerkUserId });
      } else {
        user = global.inMemoryData.users.find(u => u.clerkId === clerkUserId);
      }
    } catch (userLookupError) {
      return res.status(500).json({
        success: false,
        message: "Database error while looking up user"
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found. Please complete your profile setup."
      });
    }

    // Handle resume - either use existing one or upload new one
    let resumeUrl = user.resume;

    if (resumeFile) {
      // Validate file type (PDF only)
      if (!resumeFile.mimetype.includes("pdf")) {
        return res.status(400).json({
          success: false,
          message: "Only PDF files are allowed for resume"
        });
      }

      try {
        // If Cloudinary env is missing, use local file path instead
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
          resumeUrl = `/uploads/${resumeFile.filename}`;
        } else {
          // Upload to Cloudinary
          const uploadResponse = await cloudinary.uploader.upload(resumeFile.path, {
            folder: "user-resumes",
            resource_type: "raw",
            format: "pdf"
          });
          resumeUrl = uploadResponse.secure_url;
        }

        // Update user's resume in database
        if (isMongoConnected()) {
          await User.findByIdAndUpdate(user._id, { resume: resumeUrl });
        } else {
          // Update in-memory data
          const userIndex = global.inMemoryData.users.findIndex(u => u._id === user._id);
          if (userIndex !== -1) {
            global.inMemoryData.users[userIndex].resume = resumeUrl;
          }
        }

        // Clean up temp file only if uploaded to cloud
        if (resumeUrl && !resumeUrl.startsWith('/uploads/')) {
          fs.unlink(resumeFile.path, (err) => {
            if (err) console.error("Error deleting temp file:", err);
          });
        }

      } catch (cloudinaryError) {
        // Fallback to local file path on failure
        resumeUrl = `/uploads/${resumeFile.filename}`;
      }
    } else if (!user.resume) {
      return res.status(400).json({
        success: false,
        message: "You must upload a resume to apply for jobs"
      });
    }

    // Find the job
    let job;
    try {
      if (isMongoConnected()) {
        job = await Job.findById(jobId);
      } else {
        job = global.inMemoryData.jobs.find(j => j._id === jobId);
      }
    } catch (jobLookupError) {
      return res.status(500).json({
        success: false,
        message: "Database error while looking up job"
      });
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    // Check if user already applied for this job
    let existingApplication;
    try {
      if (isMongoConnected()) {
        existingApplication = await JobApplication.findOne({
          userId: user._id,
          jobId: jobId
        });
      } else {
        existingApplication = global.inMemoryData.applications.find(app =>
          app.userId === user._id && app.jobId === jobId
        );
      }
    } catch (applicationLookupError) {
      return res.status(500).json({
        success: false,
        message: "Database error while checking existing application"
      });
    }

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job"
      });
    }

    // Create new application
    let application;
    try {
      if (isMongoConnected()) {
        application = await JobApplication.create({
          userId: user._id,
          jobId,
          companyId: job.companyId,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
          email: user.email,
          coverLetter: coverLetter || "",
          status: "pending",
          appliedAt: new Date()
        });
      } else {
        application = handleInMemoryData('createApplication', {
          userId: user._id,
          jobId,
          companyId: job.companyId,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
          email: user.email,
          coverLetter: coverLetter || "",
          status: "pending",
          appliedAt: new Date()
        });
      }
    } catch (createError) {
      return res.status(500).json({
        success: false,
        message: "Failed to create application in database"
      });
    }

    return res.json({
      success: true,
      message: "Application submitted successfully",
      application,
      storage: isMongoConnected() ? 'MongoDB' : 'In-Memory'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error applying for job",
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getUserJobApplications = async (req, res) => {
  try {
    // Check if user is authenticated (ClerkExpressWithAuth sets req.auth.userId)
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Login required to view applications"
      });
    }

    const clerkUserId = req.auth.userId;

    // Find user in database using clerkId
    let user;
    if (isMongoConnected()) {
      user = await User.findOne({ clerkId: clerkUserId });
    } else {
      user = global.inMemoryData.users.find(u => u.clerkId === clerkUserId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    let applications;
    if (isMongoConnected()) {
      applications = await JobApplication.find({
        $or: [
          { userId: user._id },
          { email: user.email }
        ]
      })
        .populate("jobId", "title location salary")
        .populate("companyId", "name image")
        .sort({ appliedAt: -1 });
    } else {
      applications = handleInMemoryData('findApplicationsByUser', {
        userId: user._id,
        userEmail: user.email
      });
    }

    const transformedApplications = applications.map(app => ({
      _id: app._id,
      jobId: app.jobId,
      companyId: app.companyId,
      status: app.status,
      date: app.appliedAt,
      appliedAt: app.appliedAt
    }));

    return res.json({
      success: true,
      applications: transformedApplications,
      storage: isMongoConnected() ? 'MongoDB' : 'In-Memory'
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error getting applications" });
  }
};

export const updateUserResume = async (req, res) => {
  try {
    // Check if user is authenticated (ClerkExpressWithAuth sets req.auth.userId)
    if (!req.auth || !req.auth.userId) {
      return res.status(401).json({
        success: false,
        message: "Login required to update resume"
      });
    }

    const clerkUserId = req.auth.userId;
    const resumeFile = req.file;

    if (!resumeFile) {
      return res.status(400).json({ success: false, message: "Resume file is required" });
    }

    if (!resumeFile.mimetype.includes("pdf")) {
      fs.unlink(resumeFile.path, (err) => {
        if (err) console.error("Error deleting invalid file:", err);
      });
      return res.status(400).json({ success: false, message: "Only PDF files are allowed" });
    }

    // Find user in database using clerkId
    let user;
    if (isMongoConnected()) {
      user = await User.findOne({ clerkId: clerkUserId });
    } else {
      user = global.inMemoryData.users.find(u => u.clerkId === clerkUserId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found"
      });
    }

    let resumeUrl;
    try {
      const uploadResponse = await cloudinary.uploader.upload(resumeFile.path, {
        folder: "user-resumes",
        resource_type: "raw",
        format: "pdf"
      });
      resumeUrl = uploadResponse.secure_url;
    } catch (cloudinaryError) {
      resumeUrl = resumeFile.filename;
    }

    fs.unlink(resumeFile.path, (err) => {
      if (err) console.error("Error deleting temp file:", err);
    });

    // Update user's resume
    let updatedUser;
    if (isMongoConnected()) {
      updatedUser = await User.findByIdAndUpdate(
        user._id,
        { resume: resumeUrl },
        { new: true }
      ).select("-password");
    } else {
      updatedUser = handleInMemoryData('updateUserResume', { userId: user._id, resumeUrl });
    }

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "Resume updated successfully",
      user: updatedUser,
      storage: isMongoConnected() ? 'MongoDB' : 'In-Memory'
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error("Error deleting temp file after failure:", err);
      });
    }

    return res.status(500).json({ success: false, message: "Error updating resume" });
  }
};
