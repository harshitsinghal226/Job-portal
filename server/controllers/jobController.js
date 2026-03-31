import Job from "../models/Job.js";
import mongoose from "mongoose";
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
    case 'findVisibleJobs':
      return global.inMemoryData.jobs.filter(job => job.visible === true);

    case 'findJobById':
      return global.inMemoryData.jobs.find(job => job._id === data.id);

    case 'populateCompanyInfo':
      const job = data.job;
      if (job && job.companyId) {
        const company = global.inMemoryData.companies.find(c => c._id === job.companyId);
        if (company) {
          return {
            ...job,
            companyId: {
              _id: company._id,
              name: company.name,
              email: company.email,
              image: company.image
            }
          };
        }
      }
      return job;

    default:
      return null;
  }
};

export const getJobs = async (req, res) => {
  try {
    if (!isMongoConnected()) {
      if (global.inMemoryData && global.inMemoryData.jobs) {
        const visibleJobs = handleInMemoryData('findVisibleJobs');
        const jobsWithCompanyInfo = visibleJobs.map(job =>
          handleInMemoryData('populateCompanyInfo', { job })
        );

        return res.status(200).json({
          success: true,
          count: jobsWithCompanyInfo.length,
          jobs: jobsWithCompanyInfo,
          storage: 'In-Memory'
        });
      }

      return res.status(200).json({
        success: true,
        count: 0,
        jobs: [],
        storage: 'In-Memory'
      });
    }

    const jobs = await Job.find({ visible: true })
      .populate({ path: "companyId", select: "-password" })
      .lean();

    return res.status(200).json({
      success: true,
      count: jobs.length,
      jobs,
      storage: 'MongoDB'
    });
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching jobs",
      error: error.message,
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isMongoConnected()) {
      const job = handleInMemoryData('findJobById', { id });
      if (!job) {
        return res.status(404).json({
          success: false,
          message: "Job not found",
        });
      }

      const jobWithCompanyInfo = handleInMemoryData('populateCompanyInfo', { job });
      return res.status(200).json({
        success: true,
        job: jobWithCompanyInfo,
        storage: 'In-Memory'
      });
    }

    const job = await Job.findById(id)
      .populate({ path: "companyId", select: "-password" })
      .lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    return res.status(200).json({
      success: true,
      job,
      storage: 'MongoDB'
    });
  } catch (error) {
    console.error("❌ Error fetching job:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching job",
      error: error.message,
    });
  }
};
