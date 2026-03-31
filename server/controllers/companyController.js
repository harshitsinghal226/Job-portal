// companyController.js

import Company from "../models/Company.js";
import fs from "fs";
import Job from "../models/Job.js";
import JobApplication from "../models/JobApplications.js";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import generateTokens from "../utils/generateTokens.js";
import mongoose from "mongoose";
import crypto from "crypto";
import nodemailer from "nodemailer";

// ============================
// Register a new company
// ============================
export const registerCompany = async (req, res) => {
  try {
    const { name, email, password, description, location, website } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    // Owner-first policy: Only allow OWNER_COMPANY_EMAIL to register.
    const ownerEmail = (process.env.OWNER_COMPANY_EMAIL || process.env.OWNER_EMAIL || "").trim().toLowerCase();
    const allowlist = (process.env.ALLOWED_COMPANY_EMAILS || process.env.ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const emailLower = (email || "").toLowerCase();
    if (ownerEmail) {
      if (emailLower !== ownerEmail) {
        return res.status(403).json({
          success: false,
          message: "Recruiter registration is restricted to the owner.",
        });
      }
    } else if (allowlist.length > 0) {
      if (!allowlist.includes(emailLower)) {
        return res.status(403).json({
          success: false,
          message: "Recruiter registration is restricted.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Recruiter registration is disabled. Configure OWNER_COMPANY_EMAIL.",
      });
    }

    // Check if company already exists
    const existingCompany = await Company.findOne({ email });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "Company with this email already exists"
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Handle optional logo upload
    const uploadedImage = req.file?.filename || null;

    // Create company
    const company = await Company.create({
      name,
      email,
      password: hashedPassword,
      description,
      location,
      website,
      image: uploadedImage
    });

    // Generate JWT token
    const token = generateTokens(company._id);

    const imageUrl = company.image
      ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${company.image}`
      : null;

    res.status(201).json({
      success: true,
      message: "Company registered successfully",
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        description: company.description,
        location: company.location,
        website: company.website,
        image: company.image,
        imageUrl
      },
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error registering company",
      error: error.message
    });
  }
};

// ============================
// Company login
// ============================
export const loginCompany = async (req, res) => {
  const { email, password } = req.body;

  // Validate input
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required"
    });
  }

  try {
    const company = await Company.findOne({ email });

    if (!company) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Owner-first policy: Only allow OWNER_COMPANY_EMAIL (or allowlist) to login.
    const ownerEmail = (process.env.OWNER_COMPANY_EMAIL || process.env.OWNER_EMAIL || "").trim().toLowerCase();
    const allowlist = (process.env.ALLOWED_COMPANY_EMAILS || process.env.ALLOWED_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    const emailLower = (company.email || "").toLowerCase();
    if (ownerEmail) {
      if (emailLower !== ownerEmail) {
        return res.status(403).json({
          success: false,
          message: "Your company is not authorized to access recruiter features.",
        });
      }
    } else if (allowlist.length > 0) {
      if (!allowlist.includes(emailLower)) {
        return res.status(403).json({
          success: false,
          message: "Your company is not authorized to access recruiter features.",
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: "Recruiter login is disabled. Configure OWNER_COMPANY_EMAIL or ALLOWED_COMPANY_EMAILS.",
      });
    }

    const isMatch = await bcrypt.compare(password, company.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Check if JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET not configured");
      return res.status(500).json({
        success: false,
        message: "Authentication service not configured. Please contact support."
      });
    }

    const token = generateTokens(company._id);

    res.json({
      success: true,
      company: {
        _id: company._id,
        name: company.name,
        email: company.email,
        image: company.image,
        imageUrl: company.image ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${company.image}` : null,
      },
      token: token,
    });
  } catch (error) {
    console.error("Error in loginCompany:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login. Please try again."
    });
  }
};

// ============================
// Get company details
// ============================
export const getCompanyData = async (req, res) => {
  try {
    const company = req.company;
    const imageUrl = company.image
      ? `${process.env.BACKEND_URL || 'http://localhost:5000'}/uploads/${company.image}`
      : null;
    res.json({ success: true, company: { ...company.toObject(), imageUrl } });
  } catch (error) {
    console.error("Error in getCompanyData:", error);
    res.status(500).json({ success: false, message: "Error in getCompanyData" });
  }
};

// ============================
// Post a new job
// ============================
export const postJob = async (req, res) => {
  const { title, description, location, salary, level, category } = req.body;
  const companyId = req.company._id;

  try {
    // Validate required fields
    if (!title || !description || !location || !salary || !level || !category) {
      return res.status(400).json({
        success: false,
        message: "All fields are required: title, description, location, salary, level, category"
      });
    }

    // Validate salary is a positive number
    if (isNaN(salary) || salary <= 0) {
      return res.status(400).json({
        success: false,
        message: "Salary must be a positive number"
      });
    }

    // Validate level and category are valid
    const validLevels = ["Entry", "Mid", "Senior", "Lead", "Manager"];
    const validCategories = ["Programming", "Data Science", "Designing", "Networking", "Management", "Marketing", "Cybersecurity"];

    if (!validLevels.includes(level)) {
      return res.status(400).json({
        success: false,
        message: `Invalid level. Must be one of: ${validLevels.join(", ")}`
      });
    }

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(", ")}`
      });
    }

    const newJob = new Job({
      title: title.trim(),
      description: description.trim(),
      location: location.trim(),
      salary: Number(salary),
      companyId,
      date: Date.now(),
      level,
      category,
      visible: true, // default visibility
    });

    await newJob.save();

    // Populate company info for response
    const populatedJob = await Job.findById(newJob._id)
      .populate({ path: "companyId", select: "-password" })
      .lean();

    res.json({
      success: true,
      message: "Job posted successfully",
      job: populatedJob
    });
  } catch (error) {
    console.error("Error in postJob:", error);

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A job with this title already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Error posting job. Please try again."
    });
  }
};

// ============================
// Get company job applicants
// ============================
export const getCompanyJobApplicants = async (req, res) => {
  try {
    const companyId = req.company._id;

    // Fetch all applications for this company
    const applications = await JobApplication.find({ companyId })
      .populate("jobId", "title location category level salary")
      .populate("userId", "firstName lastName email image resume")
      .sort({ createdAt: -1 });

    // Transform the data to match the expected format
    const backendBase = process.env.BACKEND_URL || 'http://localhost:5000';
    const transformedApplications = applications.map(app => {
      // Determine user info based on whether it's a user application or simple application
      let userName, userEmail, userImage, userResume;

      if (app.userId) {
        // User application (with Clerk auth)
        userName = `${app.userId.firstName || ''} ${app.userId.lastName || ''}`.trim() || 'Unknown User';
        userEmail = app.userId.email || 'No email';
        userImage = app.userId.image || null;
        userResume = app.userId.resume || app.resume || null;
      } else {
        // Simple application (without auth)
        userName = app.name || 'Unknown User';
        userEmail = app.email || 'No email';
        userImage = null;
        userResume = app.resume || null;
      }

      // Resolve resume link for both Cloudinary URLs and local uploads
      let resumeLink = null;
      if (userResume) {
        if (typeof userResume === 'string' && (userResume.startsWith('http://') || userResume.startsWith('https://'))) {
          resumeLink = userResume;
        } else if (typeof userResume === 'string' && userResume.startsWith('/uploads/')) {
          resumeLink = `${backendBase}${userResume}`;
        } else if (typeof userResume === 'string') {
          resumeLink = `${backendBase}/uploads/${userResume}`;
        }
      }

      return {
        _id: app._id,
        jobId: app.jobId,
        userId: {
          name: userName,
          email: userEmail,
          image: userImage,
          resume: userResume
        },
        jobTitle: app.jobId?.title || 'N/A',
        location: app.jobId?.location || 'N/A',
        status: app.status,
        appliedAt: app.appliedAt,
        resumeLink,
        hasResume: !!resumeLink
      };
    });

    res.json({ success: true, applicants: transformedApplications });
  } catch (error) {
    console.error("Error in getCompanyJobApplicants:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Get company posted jobs + applications
// ============================
export const getCompanyPostedJobs = async (req, res) => {
  try {
    const companyId = req.company._id;

    const applications = await JobApplication.find({ companyId })
      .populate("userId", "name image resume")
      .populate("jobId", "title location category level salary")
      .exec();

    res.json({ success: true, applications });
  } catch (error) {
    console.error("Error in getCompanyPostedJobs:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================
// Get company jobs list
// ============================
export const getCompanyJobs = async (req, res) => {
  try {
    const companyId = req.company._id;

    const jobs = await Job.find({ companyId })
      .populate("companyId", "name email image")
      .sort({ date: -1 })
      .lean();

    // Add application count for each job
    const jobsWithApplicationCount = await Promise.all(
      jobs.map(async (job) => {
        const applicationCount = await JobApplication.countDocuments({ jobId: job._id });
        return {
          ...job,
          applicationCount
        };
      })
    );



    res.json({
      success: true,
      count: jobsWithApplicationCount.length,
      jobs: jobsWithApplicationCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching company jobs. Please try again."
    });
  }
};

// ============================
// Change job application status
// ============================
export const changeJobApplicationStatus = async (req, res) => {
  try {
    const { id, status } = req.body;

    // Validate input
    if (!id || !status) {
      return res.status(400).json({
        success: false,
        message: "Application ID and status are required"
      });
    }

    // Validate status
    const validStatuses = ['pending', 'reviewed', 'accepted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const application = await JobApplication.findById(id)
      .populate('jobId', 'title location')
      .populate('userId', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    // Check if the application belongs to the company
    if (application.companyId.toString() !== req.company._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to change this application"
      });
    }

    application.status = status;
    application.updatedAt = new Date();
    await application.save();

    res.json({
      success: true,
      message: "Application status updated successfully",
      application
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating application status. Please try again."
    });
  }
};

// ============================
// Change job visibility
// ============================
export const changeVisibility = async (req, res) => {
  try {
    const { id } = req.body;
    const companyId = req.company._id;



    // Validate input
    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Job ID is required"
      });
    }

    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    // Check if the job belongs to the company
    if (companyId.toString() !== job.companyId.toString()) {
      return res.status(400).json({
        success: false,
        message: "Not authorized to modify this job"
      });
    }

    // Toggle visibility
    job.visible = !job.visible;
    job.updatedAt = new Date();
    await job.save();

    res.json({
      success: true,
      message: `Job ${job.visible ? 'published' : 'hidden'} successfully`,
      job
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error updating job visibility. Please try again."
    });
  }
};

// ============================
// Company forgot password (stub)
// ============================
export const forgotCompanyPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const company = await Company.findOne({ email });
    // Always respond success, but only generate token if company exists
    if (company) {
      // Generate token and expiry (1 hour)
      const token = crypto.randomBytes(32).toString("hex");
      company.resetPasswordToken = token;
      company.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
      await company.save();

      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${baseUrl}/reset-company-password?token=${token}&email=${encodeURIComponent(email)}`;

      // Send email via SMTP if configured; otherwise log URL
      try {
        if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Boolean(process.env.SMTP_SECURE === 'true'),
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS
            }
          });

          await transporter.sendMail({
            from: process.env.MAIL_FROM || 'no-reply@job-portal.local',
            to: email,
            subject: 'Reset your recruiter password',
            html: `<p>You requested a password reset.</p>
                   <p>Click the link below to reset your password. This link expires in 1 hour.</p>
                   <p><a href="${resetUrl}">Reset Password</a></p>`
          });
        } else {
          console.log('Password reset URL (SMTP not configured):', resetUrl);
        }
      } catch (mailErr) {
        console.error('Error sending reset email:', mailErr);
      }
    }

    return res.json({
      success: true,
      message: "If an account exists, a reset link has been sent."
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error processing password reset request"
    });
  }
};

// ============================
// Company reset password (using token)
// ============================
export const resetCompanyPassword = async (req, res) => {
  try {
    const { token, email, password } = req.body;

    if (!token || !email || !password) {
      return res.status(400).json({ success: false, message: 'Token, email and new password are required' });
    }

    const company = await Company.findOne({ email, resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
    if (!company) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const saltRounds = 10;
    company.password = await bcrypt.hash(password, saltRounds);
    company.resetPasswordToken = null;
    company.resetPasswordExpires = null;
    await company.save();

    return res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};
