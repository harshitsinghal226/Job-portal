import bcrypt from "bcrypt";
import Company from "../models/Company.js";
import Job from "../models/Job.js";

const INTEGRATION_DEFAULT_PASSWORD = "integration-placeholder-password";

const VALID_LEVELS = ["Entry", "Mid", "Senior", "Lead", "Manager"];
const VALID_CATEGORIES = [
  "Programming",
  "Data Science",
  "Designing",
  "Networking",
  "Management",
  "Marketing",
  "Cybersecurity"
];

const normalize = (value) => (typeof value === "string" ? value.trim() : value);

// ─────────────────────────────────────────────
// HELPER: find or create a company by email
// ─────────────────────────────────────────────
const findOrCreateCompanyForIntegration = async (companyInput) => {
  const companyName = normalize(companyInput?.name);
  const companyEmail = normalize(companyInput?.email)?.toLowerCase();

  if (!companyName || !companyEmail) {
    return { error: "company.name and company.email are required" };
  }

  let company = await Company.findOne({ email: companyEmail });
  if (!company) {
    const hashedPassword = await bcrypt.hash(INTEGRATION_DEFAULT_PASSWORD, 10);
    company = await Company.create({
      name: companyName,
      email: companyEmail,
      password: hashedPassword
    });
  }

  return { company };
};

// ─────────────────────────────────────────────
// POST /api/integration/jobs
// Create a job from an external/partner system
// ─────────────────────────────────────────────
export const createIntegrationJob = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      salary,
      level,
      category,
      company,
      externalJobId,
      source
    } = req.body;

    // ── Required fields check ──
    if (!title || !description || !location || !salary || !level || !category || !company) {
      return res.status(400).json({
        success: false,
        message: "Required fields: title, description, location, salary, level, category, company"
      });
    }

    // ── Salary validation ──
    if (Number.isNaN(Number(salary)) || Number(salary) <= 0) {
      return res.status(400).json({
        success: false,
        message: "salary must be a positive number"
      });
    }

    // ── Level validation ──
    if (!VALID_LEVELS.includes(level)) {
      return res.status(400).json({
        success: false,
        message: `Invalid level. Allowed values: ${VALID_LEVELS.join(", ")}`
      });
    }

    // ── Category validation ──
    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed values: ${VALID_CATEGORIES.join(", ")}`
      });
    }

    // ── Prevent duplicate externalJobId (same source) ──
    if (externalJobId && source) {
      const existing = await Job.findOne({
        externalJobId: normalize(externalJobId),
        source: normalize(source)
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `A job with externalJobId "${externalJobId}" already exists for source "${source}". Use PATCH to update it.`
        });
      }
    }

    // ── Find or create company ──
    const companyResult = await findOrCreateCompanyForIntegration(company);
    if (companyResult.error) {
      return res.status(400).json({ success: false, message: companyResult.error });
    }

    // ── Create job ──
    const job = await Job.create({
      title: normalize(title),
      description: normalize(description),
      location: normalize(location),
      salary: Number(salary),
      level,
      category,
      date: Date.now(),
      visible: true,
      companyId: companyResult.company._id,
      externalJobId: normalize(externalJobId) || null,
      source: normalize(source) || "external"
    });

    const createdJob = await Job.findById(job._id)
      .populate({ path: "companyId", select: "name email image" })
      .lean();

    return res.status(201).json({
      success: true,
      message: "Job created successfully",
      job: createdJob
    });
  } catch (error) {
    console.error("❌ createIntegrationJob error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while creating integration job",
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/integration/jobs
// Public: fetch jobs with optional filters
// ─────────────────────────────────────────────
export const getIntegrationJobs = async (req, res) => {
  try {
    const { source, category, level, location, companyEmail, page, limit } = req.query;

    const filter = { visible: true };
    if (source) filter.source = source;
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (location) filter.location = new RegExp(location, "i"); // case-insensitive partial match

    // Filter by company email
    if (companyEmail) {
      const company = await Company.findOne({ email: String(companyEmail).toLowerCase() }).lean();
      if (!company) {
        return res.status(200).json({ success: true, count: 0, total: 0, page: 1, jobs: [] });
      }
      filter.companyId = company._id;
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .populate({ path: "companyId", select: "name email image" })
        .sort({ date: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Job.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
      count: jobs.length,
      jobs
    });
  } catch (error) {
    console.error("❌ getIntegrationJobs error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching integration jobs",
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/integration/jobs/:externalJobId
// Public: fetch a single job by externalJobId
// ─────────────────────────────────────────────
export const getIntegrationJobById = async (req, res) => {
  try {
    const { externalJobId } = req.params;
    const { source } = req.query;

    const filter = { externalJobId, visible: true };
    if (source) filter.source = source;

    const job = await Job.findOne(filter)
      .populate({ path: "companyId", select: "name email image" })
      .lean();

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, job });
  } catch (error) {
    console.error("❌ getIntegrationJobById error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching job",
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────
// PATCH /api/integration/jobs/:externalJobId
// Protected: update a job by externalJobId
// ─────────────────────────────────────────────
export const updateIntegrationJob = async (req, res) => {
  try {
    const { externalJobId } = req.params;
    const { source } = req.query;

    const allowedFields = ["title", "description", "location", "salary", "level", "category", "visible"];
    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = field === "salary" ? Number(req.body[field]) : req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: `No valid fields to update. Allowed fields: ${allowedFields.join(", ")}`
      });
    }

    if (updates.salary !== undefined && (Number.isNaN(updates.salary) || updates.salary <= 0)) {
      return res.status(400).json({ success: false, message: "salary must be a positive number" });
    }
    if (updates.level && !VALID_LEVELS.includes(updates.level)) {
      return res.status(400).json({
        success: false,
        message: `Invalid level. Allowed values: ${VALID_LEVELS.join(", ")}`
      });
    }
    if (updates.category && !VALID_CATEGORIES.includes(updates.category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed values: ${VALID_CATEGORIES.join(", ")}`
      });
    }

    const filter = { externalJobId };
    if (source) filter.source = source;

    const job = await Job.findOneAndUpdate(filter, { $set: updates }, { new: true })
      .populate({ path: "companyId", select: "name email image" })
      .lean();

    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({ success: true, message: "Job updated successfully", job });
  } catch (error) {
    console.error("❌ updateIntegrationJob error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while updating job",
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/integration/jobs/:externalJobId
// Protected: remove a job by externalJobId
// ─────────────────────────────────────────────
export const deleteIntegrationJob = async (req, res) => {
  try {
    const { externalJobId } = req.params;
    const { source } = req.query;

    const filter = { externalJobId };
    if (source) filter.source = source;

    const job = await Job.findOneAndDelete(filter);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Job deleted successfully",
      deletedJobId: externalJobId
    });
  } catch (error) {
    console.error("❌ deleteIntegrationJob error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while deleting job",
      error: error.message
    });
  }
};

// ─────────────────────────────────────────────
// GET /api/integration/health
// Public: check if integration API is alive
// ─────────────────────────────────────────────
export const integrationHealth = (req, res) => {
  res.status(200).json({
    success: true,
    message: "Integration API is up",
    timestamp: new Date().toISOString(),
    endpoints: {
      listJobs:    "GET  /api/integration/jobs",
      getJob:      "GET  /api/integration/jobs/:externalJobId",
      createJob:   "POST /api/integration/jobs  [requires x-api-key]",
      updateJob:   "PATCH /api/integration/jobs/:externalJobId  [requires x-api-key]",
      deleteJob:   "DELETE /api/integration/jobs/:externalJobId  [requires x-api-key]"
    }
  });
};
