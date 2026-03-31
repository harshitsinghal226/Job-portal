import React, { useContext, useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import axios from "axios";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";

const AddJob = () => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("Bangalore");
  const [category, setCategory] = useState("Programming");
  const [level, setLevel] = useState("Senior");
  const [salary, setSalary] = useState(0);
  const [description, setDescription] = useState("");
  const [editorReady, setEditorReady] = useState(false);

  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const { backendUrl, companyToken, setCompanyToken } = useContext(AppContext);

  // Component mounted
  useEffect(() => {
    // Component mounted
  }, []);

  // ✅ Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const descriptionHTML = quillRef.current.root.innerHTML;

      // Client-side validation
      if (!title.trim()) {
        toast.error("Job title is required.");
        return;
      }

      if (!descriptionHTML.trim() || descriptionHTML === '<p><br></p>') {
        toast.error("Job description is required.");
        return;
      }

      if (salary <= 0) {
        toast.error("Salary must be greater than 0.");
        return;
      }

      // Validate level and category match server expectations
      const validLevels = ["Entry", "Mid", "Senior", "Lead", "Manager"];
      const validCategories = ["Programming", "Data Science", "Designing", "Networking", "Management", "Marketing", "Cybersecurity"];
      
      if (!validLevels.includes(level)) {
        toast.error(`Invalid level. Must be one of: ${validLevels.join(", ")}`);
        return;
      }

      if (!validCategories.includes(category)) {
        toast.error(`Invalid category. Must be one of: ${validCategories.join(", ")}`);
        return;
      }

      const { data } = await axios.post(
        `${backendUrl}/api/company/post-job`,
        { title, location, category, level, salary, description: descriptionHTML },
        { headers: { token: companyToken } }
      );

      if (data.success) {
        toast.success(data.message || "Job posted successfully!");
        
        // ✅ Reset form
        setTitle("");
        setSalary(0);
        setDescription("");
        setLevel("Senior");
        setCategory("Programming");
        setLocation("Bangalore");
        
        if (quillRef.current) {
          quillRef.current.root.innerHTML = "";
        }
        
        // Navigate to manage jobs after successful post
        setTimeout(() => {
          window.location.href = "/dashboard/manage-jobs";
        }, 1500);
      } else {
        toast.error(data.message || "Failed to post job");
      }
    } catch (error) {
      console.error("Error posting job:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to post job";
      toast.error(errorMessage);
      
      // Log detailed error for debugging
      if (error.response?.data) {
        console.error("Server error details:", error.response.data);
      }

      // If unauthorized/forbidden, clear recruiter token and redirect to home
      if (error.response?.status === 401 || error.response?.status === 403) {
        try {
          setCompanyToken(null);
          localStorage.removeItem("recruiterToken");
        } catch (_) {}
        setTimeout(() => {
          window.location.href = "/";
        }, 800);
      }
    }
  };

  // ✅ Initialize Quill editor
  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Type job description...",
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline"],
            ["code-block"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link"],
            ["clean"],
          ],
        },
      });

      // Capture changes
      quillRef.current.on("text-change", () => {
        setDescription(quillRef.current.root.innerHTML);
      });

      // Mark editor as ready
      setEditorReady(true);
    }
  }, []);

  // Check if required dependencies are available
  if (!backendUrl || !companyToken) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Configuration Error
          </h2>
          <p className="text-gray-600 mb-4">
            {!backendUrl ? "Backend URL is not configured" : "Company authentication is required"}
          </p>
          <p className="text-sm text-gray-500">
            Please check your configuration and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start px-10 py-8">
      <form className="w-full max-w-2xl space-y-5" onSubmit={handleSubmit}>
        {/* Job Title */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Job Title
          </label>
          <input
            type="text"
            placeholder="Type here"
            onChange={(e) => setTitle(e.target.value)}
            value={title}
            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Job Description */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">
            Job Description
          </label>
          {!editorReady && (
            <div className="bg-gray-100 border border-gray-300 rounded-md min-h-[150px] h-[200px] flex items-center justify-center">
              <div className="text-gray-500">Loading editor...</div>
            </div>
          )}
          <div
            ref={editorRef}
            className={`bg-white border border-gray-300 rounded-md min-h-[150px] h-[200px] overflow-auto ${
              !editorReady ? 'hidden' : ''
            }`}
          />
        </div>

        {/* Job Details */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-1">
              Job Category
            </label>
            <select
              className="border border-gray-300 rounded-md p-2 w-full"
              onChange={(e) => setCategory(e.target.value)}
              value={category}
            >
              <option value="Programming">Programming</option>
              <option value="Data Science">Data Science</option>
              <option value="Designing">Designing</option>
              <option value="Networking">Networking</option>
              <option value="Management">Management</option>
              <option value="Marketing">Marketing</option>
              <option value="Cybersecurity">Cybersecurity</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-1">
              Job Location
            </label>
            <select
              className="border border-gray-300 rounded-md p-2 w-full"
              onChange={(e) => setLocation(e.target.value)}
              value={location}
            >
              <option value="Bangalore">Bangalore</option>
              <option value="Washington">Washington</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Mumbai">Mumbai</option>
              <option value="California">California</option>
              <option value="Chennai">Chennai</option>
              <option value="New York">New York</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-1">
              Job Level
            </label>
            <select
              className="border border-gray-300 rounded-md p-2 w-full"
              onChange={(e) => setLevel(e.target.value)}
              value={level}
            >
              <option value="Entry">Entry</option>
              <option value="Mid">Mid</option>
              <option value="Senior">Senior</option>
              <option value="Lead">Lead</option>
              <option value="Manager">Manager</option>
            </select>
          </div>
        </div>

        {/* Salary */}
        <div>
          <label className="block text-gray-700 font-medium mb-1">Salary</label>
          <input
            min={0}
            type="number"
            className="border border-gray-300 rounded-md p-2 w-full"
            onChange={(e) => setSalary(Number(e.target.value))}
            value={salary}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800 transition"
        >
          ADD
        </button>
      </form>
    </div>
  );
};

export default AddJob;
