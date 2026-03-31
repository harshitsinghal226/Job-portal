import express from 'express';
import { getJobById, getJobs } from '../controllers/jobController.js';
import { applyForJob, getApplicationStatus } from '../controllers/jobApplicationController.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

const router = express.Router();

// Route to get all jobs data
router.get('/', getJobs);

router.get('/application-status', ClerkExpressWithAuth({
  authorizedParties: ['http://localhost:5173', 'http://localhost:5000']
}), getApplicationStatus);

// Route to get a single job by ID
router.get('/:id', getJobById);

// Route to apply for a job - NOW REQUIRES AUTHENTICATION
router.post('/apply', ClerkExpressWithAuth({
  authorizedParties: ['http://localhost:5173', 'http://localhost:5000']
}), applyForJob);

export default router;
