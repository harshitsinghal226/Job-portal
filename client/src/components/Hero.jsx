import React, { useContext, useRef } from 'react';
import { assets } from '../assets/assets';
import { AppContext } from '../context/AppContext';

const Hero = () => {
  const { setSearchFilter, setIsSearched } = useContext(AppContext);

  const titleRef = useRef(null);
  const locationRef = useRef(null);

  const onSearch = () => {
    setSearchFilter({
      title: titleRef.current.value.trim(),
      location: locationRef.current.value.trim(),
    });
    setIsSearched(true);
  };

  return (
    <div className="bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      {/* Gradient Hero Section */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-3xl px-8 py-12 max-w-9xl mx-auto text-center space-y-6 shadow-xl">
        {/* Heading */}
        <h2 className="text-4xl sm:text-5xl font-extrabold leading-tight">
          Over <span className="text-yellow-300">10,000+</span> jobs to apply
        </h2>

        {/* Subheading */}
        <p className="text-base sm:text-lg text-blue-100 max-w-3xl mx-auto">
          Your Next Big Career Move Starts Right Here — Explore the Best Job Opportunities and Take the First Step Toward Your Future!
        </p>

        {/* Search Section */}
        <div className="bg-white rounded-full shadow-lg p-3 flex flex-col sm:flex-row items-center justify-between gap-3 mt-6 max-w-4xl mx-auto">
          {/* Search Field */}
          <div className="flex items-center w-full sm:w-1/2 bg-white rounded-full px-4 py-2 border focus-within:ring-2 focus-within:ring-blue-500">
            <img src={assets.search_icon} alt="search icon" className="w-5 h-5 mr-3" />
            <input
              type="text"
              placeholder="Search for jobs"
              className="w-full text-sm text-gray-700 placeholder-gray-500 focus:outline-none"
              ref={titleRef}
            />
          </div>

          {/* Divider (on large screens only) */}
          <div className="hidden sm:block w-px h-6 bg-gray-300"></div>

          {/* Location Field */}
          <div className="flex items-center w-full sm:w-1/2 bg-white rounded-full px-4 py-2 border focus-within:ring-2 focus-within:ring-blue-500">
            <img src={assets.location_icon} alt="location icon" className="w-5 h-5 mr-3" />
            <input
              type="text"
              placeholder="Location"
              className="w-full text-sm text-gray-700 placeholder-gray-500 focus:outline-none"
              ref={locationRef}
            />
          </div>

          {/* Search Button */}
          <button
            onClick={onSearch}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-full transition-all duration-300 w-full sm:w-auto shadow-md"
          >
            Search
          </button>
        </div>
      </div>

      {/* Trusted Companies Section */}
      <div className="border border-gray-200 shadow-sm mt-8 p-4 bg-white rounded-lg max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-center">
        <div className="flex flex-wrap justify-center gap-8 lg:gap-16 items-center">
          <p className="font-medium text-gray-600">Trusted by</p>
          <img className="h-6 " src={assets.microsoft_logo} alt="Microsoft" />
          <img className="h-6" src={assets.walmart_logo} alt="Walmart" />
          <img className="h-6 " src={assets.accenture_logo} alt="Accenture" />
          <img className="h-6 " src={assets.samsung_logo} alt="Samsung" />
          <img className="h-6 " src={assets.amazon_logo} alt="Amazon" />
          <img className="h-6" src={assets.adobe_logo} alt="Adobe" />
        </div>
      </div>
    </div>
  );
};

export default Hero;
