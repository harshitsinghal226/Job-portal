import JobApplication from '../models/JobApplications.js';
import Job from '../models/Job.js';

// ============================
// Apply for a job (simple version without user auth)
// ============================
export const applyForJob = async (req, res) => {
  try {
    // Check if models are properly imported
    if (!Job || !JobApplication) {
      console.error('❌ Models not found:', { Job: !!Job, JobApplication: !!JobApplication });
      return res.status(500).json({
        success: false,
        message: "Server configuration error"
      });
    }

    const { jobId, name, email, phone } = req.body;

    // Validate required fields
    if (!jobId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "Job ID, name, and email are required"
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    // Check if job exists
    let job;
    try {
      job = await Job.findById(jobId);
    } catch (dbError) {
      console.error('❌ Database error finding job:', dbError);
      return res.status(500).json({
        success: false,
        message: "Database error while finding job"
      });
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found"
      });
    }

    // Check if job is visible
    if (!job.visible) {
      return res.status(400).json({
        success: false,
        message: "This job is not currently accepting applications"
      });
    }

    // Check if already applied (same email for same job)
    const existingApplication = await JobApplication.findOne({
      jobId,
      email
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: "You have already applied for this job"
      });
    }

    // Handle resume file upload
    let resumeFileName = null;
    if (req.file) {
      resumeFileName = req.file.filename;
    }

    // Create application
    let application;
    try {
      application = await JobApplication.create({
        jobId,
        companyId: job.companyId,
        name,
        email,
        phone: phone || null,
        resume: resumeFileName,
        status: 'pending'
      });
    } catch (createError) {
      console.error('❌ Error creating application:', createError);
      return res.status(500).json({
        success: false,
        message: "Failed to create application in database"
      });
    }

    res.json({
      success: true,
      message: "Application submitted successfully!",
      application: {
        id: application._id,
        jobTitle: job.title,
        companyName: job.companyId?.name || 'Unknown Company',
        status: application.status,
        submittedAt: application.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error in applyForJob:', error);
    res.status(500).json({
      success: false,
      message: "Failed to submit application. Please try again."
    });
  }
};

// ============================
// Get job application status
// ============================
export const getApplicationStatus = async (req, res) => {
  try {
    const { email, jobId } = req.query;

    if (!email || !jobId) {
      return res.status(400).json({
        success: false,
        message: "Email and job ID are required"
      });
    }

    const application = await JobApplication.findOne({ email, jobId })
      .populate('jobId', 'title companyId')
      .populate('companyId', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found"
      });
    }

    res.json({
      success: true,
      application: {
        id: application._id,
        jobTitle: application.jobId?.title,
        companyName: application.companyId?.name,
        status: application.status,
        submittedAt: application.createdAt,
        updatedAt: application.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error in getApplicationStatus:', error);
    res.status(500).json({
      success: false,
      message: "Failed to get application status"
    });
  }
};
