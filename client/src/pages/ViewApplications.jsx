import React, { useContext, useEffect, useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../components/Loading";
import { AppContext } from "../context/AppContext";

const ViewApplications = () => {
  const { backendUrl, companyToken } = useContext(AppContext);
  const [applicants, setApplicants] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Fetch company job applications
  const fetchCompanyJobApplications = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/applicants`, {
        headers: { token: companyToken },
      });

      if (data.success) {
        setApplicants(data.applicants.reverse());
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to fetch applications");
    }
  };

  // Update Job Application Status
  const changeJobApplicationStatus = async (id, status) => {
    try {
      const { data } = await axios.post(
        `${backendUrl}/api/company/change-status`,
        { id, status },
        { headers: { token: companyToken } }
      );

      if (data.success) {
        toast.success(`Application ${status}`);
        fetchCompanyJobApplications();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  useEffect(() => {
    if (companyToken) {
      fetchCompanyJobApplications();
    }
  }, [companyToken]);

  if (!applicants) return <Loading />;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Job Applications</h2>

      {applicants.length === 0 ? (
        <div className="text-center text-gray-500 text-lg py-10 border rounded-lg shadow-sm bg-gray-50">
          No applications yet 🚀
        </div>
      ) : (
        <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-700 font-semibold text-sm sm:text-base">
                <th className="px-6 py-4 border-b-2 border-gray-300 text-left">#</th>
                <th className="px-6 py-4 border-b-2 border-gray-300 text-left">User</th>
                <th className="px-6 py-4 border-b-2 border-gray-300 text-left">Job Title</th>
                <th className="px-6 py-4 border-b-2 border-gray-300 text-left">Location</th>
                <th className="px-6 py-4 border-b-2 border-gray-300 text-left">Resume</th>
                <th className="px-6 py-4 border-b-2 border-gray-300 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {applicants
                .filter((item) => item.jobId && item.userId)
                .map((applicant, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-center font-medium text-gray-600">{index + 1}</td>

                    {/* User info */}
                    <td className="px-6 py-4 border-r border-gray-100">
                      <div className="flex items-center gap-4">
                        <img
                          src={applicant.userId.image || assets.profile_img}
                          alt="profile"
                          className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                          onError={(e) => {
                            e.target.src = assets.profile_img;
                          }}
                        />
                        <span className="font-medium text-gray-800">
                          {applicant.userId.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 border-r border-gray-100">
                      <span className="font-medium text-gray-700">{applicant.jobTitle}</span>
                    </td>
                    
                    <td className="px-6 py-4 border-r border-gray-100">
                      <span className="text-gray-600">{applicant.location}</span>
                    </td>

                    {/* Resume */}
                    <td className="px-6 py-4 border-r border-gray-100">
                      {applicant.hasResume && applicant.resumeLink ? (
                        <a
                          href={applicant.resumeLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 flex items-center gap-2 hover:underline font-medium"
                          onClick={(e) => {
                            // Check if the link is accessible
                            if (!applicant.resumeLink.startsWith('http')) {
                              e.preventDefault();
                              alert('Resume file not found or not accessible');
                            }
                          }}
                        >
                          Resume
                          <img
                            src={assets.resume_download_icon}
                            alt="download"
                            className="w-4 h-4"
                          />
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm italic">No resume uploaded</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 relative">
                      <div
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        className="relative"
                      >
                        {applicant.status === "pending" ? (
                          <>
                            <button className="text-gray-700 font-bold text-lg px-3 py-2 hover:bg-gray-100 rounded-md transition-colors">
                              ⋮
                            </button>
                            {hoveredIndex === index && (
                              <div className="absolute top-10 right-0 bg-white shadow-lg border border-gray-200 rounded-lg z-20 w-32">
                                <button
                                  onClick={() =>
                                    changeJobApplicationStatus(
                                      applicant._id,
                                      "accepted"
                                    )
                                  }
                                  className="block px-4 py-3 text-green-600 hover:bg-green-50 w-full text-left border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                  ✅ Accept
                                </button>
                                <button
                                  onClick={() =>
                                    changeJobApplicationStatus(
                                      applicant._id,
                                      "rejected"
                                    )
                                  }
                                  className="block px-4 py-3 text-red-600 hover:bg-red-50 w-full text-left transition-colors"
                                >
                                  ❌ Reject
                                </button>
                              </div>
                            )}
                          </>
                        ) : (
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-medium ${
                              applicant.status === "accepted"
                                ? "bg-green-100 text-green-700 border border-green-200"
                                : "bg-red-100 text-red-700 border border-red-200"
                            }`}
                          >
                            {applicant.status === "accepted" ? "Accept" : "Reject"}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewApplications;
