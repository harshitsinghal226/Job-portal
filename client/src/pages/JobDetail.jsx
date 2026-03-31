import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppContext } from '../context/AppContext';
import Loading from '../components/Loading';
import { assets } from '../assets/assets';
import kconvert from 'k-convert';
import moment from 'moment';
import Footer from '../components/Footer';
import JobCard from '../components/jobcard';
import { toast } from 'react-toastify';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

const JobDetail = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState(null);
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false);
  const [relatedJobs, setRelatedJobs] = useState([]);
  const [isApplying, setIsApplying] = useState(false);

  const { jobs, backendUrl, userData, userApplications, refreshApplications } =
    useContext(AppContext);

  // ✅ Fetch single job
  const fetchJob = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
      if (data.success) {
        setJobData(data.job);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Check if user already applied
  const checkAlreadyApplied = async () => {
    try {
      if (userData) {
        // For logged-in users, check from context
        const hasApplied = userApplications.some(
          (item) => item.jobId?._id === jobData?._id
        );
        setIsAlreadyApplied(hasApplied);
      } else {
        // For non-logged-in users, they cannot apply
        setIsAlreadyApplied(false);
      }
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  // ✅ Apply handler for logged-in users
  const applyHandler = async () => {
    try {
      if (!userData) {
        // Non-logged-in user - redirect to sign in
        navigate('/sign-in');
        toast.info('Please sign in to apply for jobs');
        return;
      }

      if (isAlreadyApplied) {
        toast.error('You have already applied for this job');
        return;
      }

      if (!userData.resume) {
        navigate('/applications');
        return toast.error('You must upload a resume to apply for a job');
      }

      setIsApplying(true);
      const token = await getToken();

      const { data } = await axios.post(
        `${backendUrl}/api/users/apply-job`,
        { jobId: jobData._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        await refreshApplications();
        setIsAlreadyApplied(true);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsApplying(false);
    }
  };

  // Get related jobs from the same company
  useEffect(() => {
    if (!jobs || !jobData) return;

    const related = jobs
      .filter((job) =>
        job?._id !== jobData?._id &&
        job?.companyId?._id && jobData?.companyId?._id && job.companyId._id === jobData.companyId._id
      )
      .filter((job) => {
        const appliedJobIds = new Set(
          userApplications.map((app) => app.jobId && app.jobId._id)
        );
        return !appliedJobIds.has(job._id);
      })
      .slice(0, 3);

    setRelatedJobs(related);
  }, [jobs, jobData, userApplications]);

  // Fetch job on mount
  useEffect(() => {
    fetchJob();
  }, [id]);

  // Check if applied when data changes
  useEffect(() => {
    if (jobData && userData) {
      checkAlreadyApplied();
    }
  }, [jobData, userData]);

  return jobData ? (
    <>
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Job Header */}
        <div className="bg-blue-50 border border-blue-300 rounded-xl p-8 shadow-md flex flex-col md:flex-row justify-between items-center md:items-start gap-8 mb-8">
          {/* Left */}
          <div className="flex items-start gap-6">
            <img
              src={(() => {
                if (!jobData.companyId) return assets.default_company_logo;
                if (jobData.companyId.imageUrl) return jobData.companyId.imageUrl;
                if (jobData.companyId.image) {
                  if (jobData.companyId.image.startsWith('http')) {
                    return jobData.companyId.image;
                  }
                  return `${import.meta.env.VITE_BACKEND_URL}/uploads/${jobData.companyId.image}`;
                }
                return assets.default_company_logo;
              })()}
              alt="Company Logo"
              className="w-24 h-24 object-contain rounded-lg bg-white border"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div>
              <h1 className="text-3xl font-semibold mb-2">{jobData.title}</h1>
              <div className="flex flex-wrap gap-4 text-gray-700 text-sm">
                <span className="flex items-center gap-2">
                  <img src={assets.suitcase_icon} alt="" className="w-4 h-4" />
                  {jobData.companyId.name}
                </span>
                <span className="flex items-center gap-2">
                  <img src={assets.location_icon} alt="" className="w-4 h-4" />
                  {jobData.location}
                </span>
                <span className="flex items-center gap-2">
                  <img src={assets.person_icon} alt="" className="w-4 h-4" />
                  {jobData.level}
                </span>
                <span className="flex items-center gap-2">
                  <img src={assets.money_icon} alt="" className="w-4 h-4" />
                  CTC: {kconvert.convertTo(jobData.salary)}
                </span>
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="flex flex-col items-end gap-3">
            {!userData ? (
              <button
                onClick={() => navigate('/sign-in')}
                className="px-6 py-3 rounded-md text-sm font-medium transition bg-blue-600 text-white hover:bg-blue-700"
              >
                Sign In to Apply
              </button>
            ) : (
              <button
                onClick={applyHandler}
                disabled={isAlreadyApplied || isApplying}
                className={`px-6 py-3 rounded-md text-sm font-medium transition ${
                  isAlreadyApplied
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isApplying ? 'Applying...' : isAlreadyApplied ? 'Applied' : 'Apply Now'}
              </button>
            )}
            <p className="text-xs text-blue-600 underline">
              Posted {moment(jobData.date).fromNow()}
            </p>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-x-8">
          {/* Job Details */}
          <div className="lg:col-span-2">
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h2 className="text-2xl font-semibold text-gray-800">Job Description</h2>
            </div>
            <div
              className="rich-text text-gray-700 text-base leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: jobData.description }}
            ></div>

            {/* Already Applied Message */}
            {isAlreadyApplied && (
              <div className="mt-10 bg-green-50 border border-green-300 rounded-xl p-8 shadow-md text-center">
                <div className="text-green-600 text-6xl mb-4">✅</div>
                <h2 className="text-2xl font-semibold text-green-800 mb-2">Already Applied!</h2>
                <p className="text-green-700 mb-6">
                  You have already applied for this job. We'll review your application and get back to you soon.
                </p>
                <button
                  onClick={() => navigate('/applications')}
                  className="bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 transition"
                >
                  View My Applications
                </button>
              </div>
            )}

            {/* Sign In Prompt for Non-logged-in Users */}
            {!userData && (
              <div className="mt-10 bg-blue-50 border border-blue-300 rounded-xl p-8 shadow-md text-center">
                <div className="text-blue-600 text-6xl mb-4">🔐</div>
                <h2 className="text-2xl font-semibold text-blue-800 mb-2">Sign In Required</h2>
                <p className="text-blue-700 mb-6">
                  You need to be signed in to apply for this job. Please sign in or create an account to continue.
                </p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => navigate('/sign-in')}
                    className="bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/sign-up')}
                    className="bg-green-600 text-white py-3 px-6 rounded-md font-medium hover:bg-green-700 transition"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* More Jobs from Company */}
          <div className="lg:col-span-1 mt-12 lg:mt-0">
            <h2 className="text-2xl font-semibold mb-6">
              More jobs from {jobData.companyId?.name || 'Company'}
            </h2>
            <div className="space-y-6">
              {relatedJobs.length > 0 ? (
                relatedJobs.map((job, index) => (
                  <JobCard key={index} job={job} />
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No other jobs available from this company.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <style>
        {`
          .rich-text h3, .rich-text h4, .rich-text strong {
            font-weight: 600;
            font-size: 1.125rem;
          }
          .rich-text p { margin-top: 0.5rem; }
          .rich-text ul, .rich-text ol {
            padding-left: 1.5rem;
            margin-top: 0.5rem;
          }
          .rich-text ul { list-style: disc; }
          .rich-text ol { list-style: decimal; }
          .rich-text li { margin-top: 0.25rem; }
        `}
      </style>
    </>
  ) : (
    <Loading />
  );
};

export default JobDetail;
