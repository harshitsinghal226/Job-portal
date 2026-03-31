import React, { useContext, useState, useEffect } from "react";
import { assets, JobCategories, JobLocations } from "../assets/assets";
import { AppContext } from "../context/AppContext";
import JobCard from "./jobcard";

const JobListing = () => {
  const { isSearched, searchFilter, setSearchFilter, jobs, isJobsLoading } =
    useContext(AppContext);

  const [showFilter, setShowFilter] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);

  // Category filter toggle
  const handleCategoryChange = (category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Location filter toggle
  const handleLocationChange = (location) => {
    setSelectedLocations((prev) =>
      prev.includes(location)
        ? prev.filter((c) => c !== location)
        : [...prev, location]
    );
  };

  // Filter jobs
  useEffect(() => {
    if (!jobs) return;

    const matchesCategory =
      (job) =>
        selectedCategories.length === 0 ||
        selectedCategories.includes(job.category);

    const matchesLocation =
      (job) =>
        selectedLocations.length === 0 ||
        selectedLocations.includes(job.location);

    const matchesTitle =
      (job) =>
        searchFilter.title === "" ||
        job.title.toLowerCase().includes(searchFilter.title.toLowerCase()) ||
        (job.category && job.category.toLowerCase().includes(searchFilter.title.toLowerCase()));

    const matchesSearchLocation =
      (job) =>
        searchFilter.location === "" ||
        job.location.toLowerCase().includes(searchFilter.location.toLowerCase());

    const newFilteredJobs = jobs
      .slice()
      .reverse()
      .filter(
        (job) =>
          matchesCategory(job) &&
          matchesLocation(job) &&
          matchesTitle(job) &&
          matchesSearchLocation(job)
      );

    setFilteredJobs(newFilteredJobs);
    setCurrentPage(1); // Reset to first page
  }, [jobs, selectedCategories, selectedLocations, searchFilter]);

  // Pagination
  const jobsPerPage = 6;
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  const handlePageChange = (pageNum) => {
    setCurrentPage(pageNum);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 lg:p-8 bg-gray-50 min-h-screen">
      {/* Sidebar */}
      <aside className="bg-white p-6 rounded-2xl shadow-md w-full lg:w-1/4 lg:sticky top-6 h-fit">
        {/* Current Search */}
        {isSearched &&
          (searchFilter.title !== "" || searchFilter.location !== "") && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 text-gray-700">
                Current Search
              </h3>
              <div className="flex flex-wrap gap-2">
                {searchFilter.title && (
                  <span className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                    {searchFilter.title}
                    <img
                      src={assets.cross_icon}
                      alt="remove"
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setSearchFilter((prev) => ({ ...prev, title: "" }))
                      }
                    />
                  </span>
                )}
                {searchFilter.location && (
                  <span className="flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                    {searchFilter.location}
                    <img
                      src={assets.cross_icon}
                      alt="remove"
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setSearchFilter((prev) => ({ ...prev, location: "" }))
                      }
                    />
                  </span>
                )}
              </div>
            </div>
          )}

        {/* Toggle Button */}
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-sm w-full text-center ${showFilter
            ? "bg-red-100 text-red-700 hover:bg-red-200"
            : "bg-blue-100 text-blue-700 hover:bg-blue-200"
            }`}
        >
          {showFilter ? "Close Filters" : "Show Filters"}
        </button>

        <div className="h-6" />

        {/* Categories */}
        <div className={showFilter ? "" : "max-lg:hidden"}>
          <h4 className="font-semibold text-lg text-gray-800 mb-4">
            Search by Categories
          </h4>
          <ul className="space-y-3 text-gray-600">
            {JobCategories.map((category, index) => (
              <li key={index} className="flex gap-3 items-center">
                <input
                  id={`category-${index}`}
                  className="scale-110 accent-blue-600 cursor-pointer"
                  type="checkbox"
                  onChange={() => handleCategoryChange(category)}
                  checked={selectedCategories.includes(category)}
                />
                <label
                  htmlFor={`category-${index}`}
                  className="cursor-pointer"
                >
                  {category}
                </label>
              </li>
            ))}
          </ul>
        </div>

        {/* Locations */}
        <div className={`${showFilter ? "mt-6" : "max-lg:hidden"}`}>
          <h4 className="font-semibold text-lg text-gray-800 mb-4">
            Search by Location
          </h4>
          <ul className="space-y-3 text-gray-600">
            {JobLocations.map((location, index) => (
              <li key={index} className="flex gap-3 items-center">
                <input
                  id={`location-${index}`}
                  className="scale-110 accent-red-600 cursor-pointer"
                  type="checkbox"
                  onChange={() => handleLocationChange(location)}
                  checked={selectedLocations.includes(location)}
                />
                <label
                  htmlFor={`location-${index}`}
                  className="cursor-pointer"
                >
                  {location}
                </label>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Job Listings */}
      <section className="w-full lg:w-3/4 text-gray-800" id="job-list">
        <h3 className="text-2xl font-bold mb-2 text-gray-700">Latest Jobs</h3>
        <p className="mb-6 text-gray-500">
          Get your desired job from top companies
        </p>

        {/* Job Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {isJobsLoading ? (
            <div className="col-span-full flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 text-sm font-medium">Loading jobs...</p>
              </div>
            </div>
          ) : filteredJobs.length > 0 ? (
            filteredJobs
              .slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage)
              .map((job, index) => <JobCard key={index} job={job} />)
          ) : (
            <p className="col-span-full text-center text-gray-500">
              No jobs found. Try adjusting filters.
            </p>
          )}
        </div>

        {/* Pagination */}
        {filteredJobs.length > 0 && (
          <div className="flex items-center justify-center mt-8 gap-2">
            {/* Left Arrow */}
            <button
              aria-label="Previous page"
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              <img
                src={assets.left_arrow_icon}
                alt="Previous"
                className={`w-8 h-8 p-1 border border-gray-300 rounded-md hover:bg-gray-100 transition-all duration-200 ${currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              />
            </button>

            {/* Page Numbers */}
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 text-sm font-medium rounded-md border transition-all duration-200 ${currentPage === index + 1
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-600 hover:bg-blue-100"
                  }`}
              >
                {index + 1}
              </button>
            ))}

            {/* Right Arrow */}
            <button
              aria-label="Next page"
              onClick={() =>
                handlePageChange(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <img
                src={assets.right_arrow_icon}
                alt="Next"
                className={`w-8 h-8 p-1 border border-gray-300 rounded-md hover:bg-gray-100 transition-all duration-200 ${currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
                  }`}
              />
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default JobListing;
