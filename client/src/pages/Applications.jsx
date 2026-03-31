import React, { useContext, useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from "react-toastify";

const Applications = () => {
  const { user } = useUser();
  const { getToken } = useAuth();

  const [isEdit, setIsEdit] = useState(false);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    backendUrl,
    userData,
    fetchUserData,
    userApplications,
    fetchUserApplications,
    refreshApplications,
  } = useContext(AppContext);

  // ✅ Upload resume
  const updateResume = async () => {
    try {
      if (!resume) {
        toast.error("Please select a PDF file first");
        return;
      }

      const formData = new FormData();
      formData.append("resume", resume);

      const token = await getToken();

      setLoading(true);
      const { data } = await axios.post(
        backendUrl + "/api/users/update-resume",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLoading(false);

      if (data.success) {
        toast.success(data.message);
        await fetchUserData(); // This will update user data including resume
        setIsEdit(false);
        setResume(null);
        // Note: Applications don't need to be refreshed when resume is updated
        // Only refresh if you need to show updated application data
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      setLoading(false);
      toast.error(error.message || "Failed to upload resume");
    }
  };

  // ✅ Status styling
  const getStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // ✅ Format date
  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ✅ Fetch user applications
  useEffect(() => {
    const fetchApps = async () => {
      if (!user) return;
      
      setTableLoading(true);
      try {
        await fetchUserApplications();
      } catch (error) {
        console.error("Failed to fetch applications:", error);
        toast.error("Failed to load applications");
      } finally {
        setTableLoading(false);
      }
    };

    fetchApps();
  }, [user]); // Remove fetchUserApplications from dependencies to prevent infinite loop

  // ✅ Custom refresh function with loading state
  const handleRefresh = async () => {
    if (!user || refreshing) return;
    
    setRefreshing(true);
    try {
      await refreshApplications();
      toast.success("Applications refreshed successfully");
    } catch (error) {
      console.error("Failed to refresh applications:", error);
      toast.error("Failed to refresh applications");
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        {/* Resume Section */}
        <h2 className="text-2xl font-semibold mb-4">Your Resume</h2>
        <div className="mb-10">
          {isEdit || !userData?.resume ? (
            <label
              htmlFor="resumeUpload"
              className="flex flex-wrap items-center gap-4 cursor-pointer"
            >
              <input
                id="resumeUpload"
                type="file"
                hidden
                accept="application/pdf"
                onChange={(e) => setResume(e.target.files[0])}
              />
              <img
                src={assets.profile_upload_icon}
                alt="Upload resume"
                className="w-10 h-10"
              />
              <p className="text-gray-600">
                {resume ? resume.name : "Select a PDF file"}
              </p>
              <button
                type="button"
                onClick={updateResume}
                disabled={!resume || loading}
                className={`px-4 py-1 rounded-md text-sm transition ${
                  resume && !loading
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </label>
          ) : (
                         <div className="flex items-center gap-4">
               <button
                 onClick={() => {
                   try {
                     // Try to open resume in new tab
                     if (userData?.resume) {
                       window.open(userData.resume, '_blank', 'noopener,noreferrer');
                     } else {
                       toast.error("No resume available");
                     }
                   } catch (error) {
                     console.error("Error opening resume:", error);
                     toast.error("Failed to open resume. Please try again.");
                   }
                 }}
                 className="bg-blue-100 text-blue-800 px-4 py-1 rounded-md text-sm font-medium hover:bg-blue-200"
               >
                 View Resume
               </button>
               <button
                 type="button"
                 onClick={() => setIsEdit(true)}
                 className="bg-white border border-gray-400 px-4 py-1 rounded-md text-sm hover:bg-gray-50"
               >
                 Edit
               </button>
             </div>
          )}
        </div>

        {/* Applications Table */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold">Jobs Applied</h2>
          <button
            onClick={handleRefresh}
            disabled={refreshing || tableLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          {tableLoading ? (
            <p className="p-6 text-center text-gray-500">
              Loading applications...
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="px-6 py-4">Company</th>
                  <th className="px-6 py-4">Job Title</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {userApplications.length > 0 ? (
                  userApplications.map((job, index) => (
                    <tr
                      key={job._id || index}
                      className="border-b odd:bg-white even:bg-gray-50 hover:bg-gray-100"
                    >
                      <td className="px-6 py-4 flex items-center gap-3">
                        <img
                          src={(() => {
                  if (!job.companyId) return assets.default_company_logo;
                  if (job.companyId.imageUrl) return job.companyId.imageUrl;
                  if (job.companyId.image) {
                    if (job.companyId.image.startsWith('http')) {
                      return job.companyId.image;
                    }
                    return `${import.meta.env.VITE_BACKEND_URL}/uploads/${job.companyId.image}`;
                  }
                  return assets.default_company_logo;
                })()}
                          alt={job.companyId?.name || "Company"}
                          className="w-6 h-6 object-contain"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        {job.companyId?.name}
                      </td>
                      <td className="px-6 py-4">{job.jobId?.title}</td>
                      <td className="px-6 py-4">{job.jobId?.location}</td>
                      <td className="px-6 py-4">{formatDate(job.date)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                            job.status
                          )}`}
                        >
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Applications;
