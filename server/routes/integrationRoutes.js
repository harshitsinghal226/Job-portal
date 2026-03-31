import express from "express";
import {
  createIntegrationJob,
  getIntegrationJobs,
  getIntegrationJobById,
  updateIntegrationJob,
  deleteIntegrationJob,
  integrationHealth
} from "../controllers/integrationController.js";
import { requireIntegrationApiKey } from "../middleware/integrationAuth.js";
import { integrationReadLimiter, integrationWriteLimiter } from "../middleware/rateLimit.js";

const router = express.Router();

// ── Health check (public) ────────────────────────────────
router.get("/health", integrationHealth);

// ── Read endpoints (public, rate-limited) ───────────────
router.get("/jobs",                integrationReadLimiter,  getIntegrationJobs);
router.get("/jobs/:externalJobId", integrationReadLimiter,  getIntegrationJobById);

// ── Write endpoints (protected + rate-limited) ───────────
router.post(  "/jobs",                integrationWriteLimiter, requireIntegrationApiKey, createIntegrationJob);
router.patch( "/jobs/:externalJobId", integrationWriteLimiter, requireIntegrationApiKey, updateIntegrationJob);
router.delete("/jobs/:externalJobId", integrationWriteLimiter, requireIntegrationApiKey, deleteIntegrationJob);

export default router;
