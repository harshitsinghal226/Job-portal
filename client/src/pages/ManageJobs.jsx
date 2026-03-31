import React, { useContext, useEffect, useState } from "react";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { toast } from "react-toastify";
import Loading from "../components/Loading";

const ManageJobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState(null); // null → loading
  const { backendUrl, companyToken } = useContext(AppContext);

  // Fetch company jobs
  const fetchCompanyJobs = async () => {
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/list-jobs`, {
        headers: { token: companyToken },
      });

      if (data.success) {
        // Ensure data.jobs is an array before processing
        if (Array.isArray(data.jobs)) {
          setJobs([...data.jobs].reverse()); // safer copy before reverse
        } else {
          console.error("Expected jobs array but got:", typeof data.jobs, data.jobs);
          setJobs([]);
          toast.error("Invalid data format received from server");
        }
      } else {
        toast.error(data.message || "Failed to fetch jobs");
        setJobs([]);
      }
    } catch (error) {
      console.error("Error fetching company jobs:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to fetch jobs");
      setJobs([]);
    }
  };

  // Change visibility toggle
  const changeJobVisibility = async (id) => {
    try {

      const { data } = await axios.post(
        `${backendUrl}/api/company/change-visibility`,
        { id },
        { headers: { token: companyToken } }
      );

      if (data.success) {
        toast.success(data.message || "Job visibility updated");
        setJobs((prev) =>
          prev.map((job) =>
            job._id === id ? { ...job, visible: !job.visible } : job
          )
        ); // update state directly (avoids refetch)
      } else {
        toast.error(data.message || "Failed to update visibility");
      }
    } catch (error) {
      console.error("Error updating job visibility:", error);
      toast.error(error.response?.data?.message || error.message || "Failed to update visibility");
    }
  };

  useEffect(() => {
    if (companyToken) fetchCompanyJobs();
  }, [companyToken]);

  // UI states
  if (jobs === null) return <Loading />;

  if (!Array.isArray(jobs) || jobs.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-60">
        <p className="text-gray-600 text-lg">No jobs available</p>
        <button
          onClick={() => navigate("/dashboard/add-job")}
          className="mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md shadow"
        >
          + Add New Job
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm border border-gray-200 shadow-md rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="py-3 px-4 border-b">#</th>
              <th className="py-3 px-4 border-b">Job Title</th>
              <th className="py-3 px-4 border-b">Date</th>
              <th className="py-3 px-4 border-b">Location</th>
              <th className="py-3 px-4 border-b">Applicants</th>
              <th className="py-3 px-4 border-b text-center">Visible</th>
            </tr>
          </thead>
          <tbody>
            {jobs.filter(job => job && job._id).map((job, index) => (
              <tr
                key={job._id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <td className="py-3 px-4 border-b">{index + 1}</td>
                <td className="py-3 px-4 border-b font-medium">{job.title || 'N/A'}</td>
                <td className="py-3 px-4 border-b">
                  {job.date ? moment(job.date).format("ll") : 'N/A'}
                </td>
                <td className="py-3 px-4 border-b">{job.location || 'N/A'}</td>
                <td className="py-3 px-4 border-b">{job.applicationCount || 0}</td>
                <td className="py-3 px-4 border-b text-center">
                  <input
                    type="checkbox"
                    checked={job.visible || false}
                    onChange={() => changeJobVisibility(job._id)}
                    className="scale-125 cursor-pointer accent-blue-500"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          onClick={() => navigate("/dashboard/add-job")}
          className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md shadow"
        >
          + Add New Job
        </button>
      </div>
    </div>
  );
};

export default ManageJobs;
