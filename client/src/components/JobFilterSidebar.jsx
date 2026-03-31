import React, { useState } from "react";
import { assets, JobCategories, JobLocations } from "../assets/assets";

const JobFilterSidebar = ({ 
  selectedCategories, 
  setSelectedCategories, 
  selectedLocations, 
  setSelectedLocations,
  showFilter = true,
  setShowFilter,
  className = ""
}) => {
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

  return (
    <div className={`bg-white border-2 border-gray-200 rounded-xl shadow-lg w-full lg:w-full p-6 ${className}`}>
      {/* Toggle Button */}
      {setShowFilter && (
        <div className="mb-6">
          <button
            onClick={() => setShowFilter((prev) => !prev)}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 text-center border ${
              showFilter
                ? "bg-red-100 text-red-700 hover:bg-red-200 border-red-300"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300"
            }`}
          >
            {showFilter ? "Close Filters" : "Show Filters"}
          </button>
        </div>
      )}

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
    </div>
  );
};

export default JobFilterSidebar;
