import express from 'express';
import {
  changeJobApplicationStatus,
  changeVisibility,
  getCompanyData,
  getCompanyJobApplicants,
  getCompanyPostedJobs,
  getCompanyJobs,
  loginCompany,
  postJob,
  registerCompany,
  forgotCompanyPassword,
  resetCompanyPassword
} from '../controllers/companyController.js';
import { applyForJob, getApplicationStatus } from '../controllers/jobApplicationController.js';
import { uploadImageWithDebug, uploadJobApplicationWithDebug } from '../config/multer.js';
import { protectCompany } from '../middleware/authmiddleware.js';
import Company from '../models/Company.js';


const router = express.Router();

// Test endpoint to verify route and allowlist status
router.get('/test', (req, res) => {
  const allowlist = (process.env.ALLOWED_COMPANY_EMAILS || "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
  res.json({
    success: true,
    message: 'Company routes are working!',
    allowlistEnabled: allowlist.length > 0,
    allowlistCount: allowlist.length,
  });
});

// WhoAmI for recruiter tokens (debug)
router.get('/whoami', protectCompany, (req, res) => {
  res.json({ success: true, company: { id: req.company._id, email: req.company.email, name: req.company.name } });
});

// Debug endpoint to see all companies (remove this in production)
router.get('/debug/companies', async (req, res) => {
  try {
    const companies = await Company.find({}, { password: 0 }); // Don't show passwords
    res.json({ success: true, count: companies.length, companies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

//Register a company
router.post('/register', uploadImageWithDebug, registerCompany);
//Company login
router.post('/login', loginCompany);
// Forgot password (recruiter)
router.post('/forgot-password', forgotCompanyPassword);
// Reset password (recruiter)
router.post('/reset-password', resetCompanyPassword);

//COMPANY data
router.get('/profile', protectCompany, getCompanyData);

//post a job
router.post('/post-job', protectCompany, postJob);

//Get Applicants Data of Company
router.get('/applicants', protectCompany, getCompanyJobApplicants);

//Get company job list
router.get('/list-jobs', protectCompany, getCompanyJobs);

//change application status
router.post('/change-status', protectCompany, changeJobApplicationStatus);

//Change Applications Visibility  
router.post('/change-visibility', protectCompany, changeVisibility);

// Job application routes (no authentication required)
router.post('/apply-job', uploadJobApplicationWithDebug, applyForJob);
router.get('/application-status', getApplicationStatus);

export default router;