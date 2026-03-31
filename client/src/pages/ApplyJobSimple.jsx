import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import moment from "moment";
import { assets } from "../assets/assets";
import Loading from "../components/Loading";
import JobCard from "../components/jobcard";
import JobFilterSidebar from "../components/JobFilterSidebar";
import { AppContext } from "../context/AppContext";
import { useAuth } from "@clerk/clerk-react";

const ApplyJobSimple = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, isLoaded, isSignedIn: clerkSignedIn } = useAuth();
  const [jobData, setJobData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [isAlreadyApplied, setIsAlreadyApplied] = useState(false);
  const [resume, setResume] = useState(null);
  const [showFilter, setShowFilter] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredRelatedJobs, setFilteredRelatedJobs] = useState([]);

  const { jobs, userApplications, userData } = useContext(AppContext);
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  // Validate backend URL is set
  if (!backendUrl) {
    console.error('❌ VITE_BACKEND_URL environment variable is not set!');
    return <div className="text-center py-10">Backend URL not configured. Please check your environment variables.</div>;
  }

  // Check if user is already applied for this job
  useEffect(() => {
    if (userApplications && jobData) {
      const hasApplied = userApplications.some(app => 
        app.jobId && app.jobId._id === jobData._id
      );
      setIsAlreadyApplied(hasApplied);
    }
  }, [userApplications, jobData]);

  // Redirect non-logged-in users (wait for Clerk to load)
  useEffect(() => {
    if (isLoading || !isLoaded) return;
    if (!clerkSignedIn) {
      toast.error("Please sign in to apply for jobs");
      navigate(`/sign-in?redirect=${encodeURIComponent(`/apply-job/${id}`)}`);
    }
  }, [isLoading, isLoaded, clerkSignedIn, navigate, id]);

  // Fetch job data
  const fetchJob = async () => {
    try {
      console.log("🔍 Fetching job with ID:", id);
      const { data } = await axios.get(`${backendUrl}/api/jobs/${id}`);
      if (data.success) {
        setJobData(data.job);
        console.log("✅ Job fetched successfully:", data.job.title);
      } else {
        console.error("❌ Job fetch failed:", data.message);
        toast.error(data.message || "Failed to fetch job details");
        navigate("/");
      }
    } catch (error) {
      console.error("❌ Job fetch error:", error.response?.status, error.message);
      if (error.response?.status === 404) {
        toast.error("Job not found");
      } else {
        toast.error("Failed to fetch job details");
      }
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle job application with resume upload
  const handleApply = async (e) => {
    e.preventDefault();
    
    if (!clerkSignedIn) {
      toast.error("Please sign in to apply for jobs");
      navigate(`/sign-in?redirect=${encodeURIComponent(`/apply-job/${id}`)}`);
      return;
    }

    if (!resume) {
      toast.error("Please upload your resume");
      return;
    }

    setIsApplying(true);
    try {
      // Get Clerk token for authentication
      const token = await getToken();
      
      // Create FormData for file upload
      const applicationData = new FormData();
      applicationData.append("jobId", id);
      if (resume) {
        applicationData.append("resume", resume);
      }

      const { data } = await axios.post(
        `${backendUrl}/api/users/apply-job`,
        applicationData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (data.success) {
        toast.success(data.message || "Application submitted successfully!");
        setIsAlreadyApplied(true);
        // Reset form
        setResume(null);
      } else {
        toast.error(data.message || "Failed to submit application");
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || "Failed to submit application";
      toast.error(errorMessage);
    } finally {
      setIsApplying(false);
    }
  };

  // Filter related jobs based on selected categories and locations
  useEffect(() => {
    if (!jobs || !jobData) return;

    const matchesCategory = (job) =>
      selectedCategories.length === 0 ||
      selectedCategories.includes(job.category);

    const matchesLocation = (job) =>
      selectedLocations.length === 0 ||
      selectedLocations.includes(job.location);

    const filteredJobs = jobs
      .filter((job) => job._id !== jobData._id) // Exclude current job
      .filter((job) => {
        const appliedJobIds = new Set(
          userApplications.map((app) => app.jobId && app.jobId._id)
        );
        return !appliedJobIds.has(job._id);
      })
      .filter(matchesCategory)
      .filter(matchesLocation)
      .slice(0, 3); // Show up to 3 related jobs

    setFilteredRelatedJobs(filteredJobs);
  }, [jobs, jobData, selectedCategories, selectedLocations, userApplications]);

  // Fetch job on mount
  useEffect(() => {
    fetchJob();
  }, [id]);

  if (isLoading || !isLoaded) return <Loading />;
  if (!jobData) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h1>
        <p className="text-gray-600 mb-8">The job you're looking for doesn't exist or has been removed.</p>
        <button 
          onClick={() => navigate("/")}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          Browse Jobs
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      {/* Job Header */}
      <div className="bg-blue-50 border border-blue-300 rounded-xl p-8 shadow-md mb-8">
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
            onError={(e) => { e.currentTarget.src = assets.default_avatar; }}
          />
          <div>
            <h1 className="text-3xl font-semibold mb-2">{jobData.title}</h1>
            <div className="flex flex-wrap gap-4 text-gray-700 text-sm">
              <span className="flex items-center gap-2">
                <img src={assets.suitcase_icon} alt="" className="w-4 h-4" />
                {jobData.companyId?.name || "Unknown Company"}
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
                CTC: {jobData.salary}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Three-column layout with filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-x-8">
        {/* Filter Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <JobFilterSidebar
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              selectedLocations={selectedLocations}
              setSelectedLocations={setSelectedLocations}
              showFilter={showFilter}
              setShowFilter={setShowFilter}
            />
          </div>
        </div>

        {/* Application Form */}
        <div className="lg:col-span-2">
          {!clerkSignedIn ? (
            <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-md text-center">
              <h2 className="text-2xl font-semibold mb-4">Sign In Required</h2>
              <p className="text-gray-600 mb-6">Please sign in to apply for this job.</p>
              <button
                onClick={() => navigate(`/sign-in?redirect=${encodeURIComponent(`/apply-job/${id}`)}`)}
                className="bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition"
              >
                Sign In
              </button>
            </div>
          ) : !isAlreadyApplied ? (
            <div className="bg-white border border-gray-300 rounded-xl p-8 shadow-md">
              <h2 className="text-2xl font-semibold mb-6 text-center">Apply for this Job</h2>
              <p className="text-center text-gray-600 mb-6">
                You are applying as: <strong>{userData?.firstName} {userData?.lastName}</strong> ({userData?.email})
              </p>
              
              <form onSubmit={handleApply} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resume (PDF) *
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setResume(e.target.files[0])}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {resume && (
                      <span className="text-sm text-green-600">
                        ✓ {resume.name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Please upload your resume in PDF format (max 5MB)
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isApplying}
                    className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {isApplying ? "Submitting..." : "Apply for Job"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-md font-medium hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white border border-green-300 rounded-xl p-8 shadow-md text-center">
              <h2 className="text-2xl font-semibold mb-4 text-green-600">Already Applied!</h2>
              <p className="text-gray-600 mb-6">You have already applied for this job.</p>
              <button
                onClick={() => navigate("/")}
                className="bg-blue-600 text-white py-3 px-6 rounded-md font-medium hover:bg-blue-700 transition"
              >
                Back to Jobs
              </button>
            </div>
          )}
        </div>

        {/* Related Jobs */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-lg font-semibold mb-4">Related Jobs</h3>
            <div className="space-y-4">
              {filteredRelatedJobs.map((job) => (
                <JobCard key={job._id} job={job} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplyJobSimple;
