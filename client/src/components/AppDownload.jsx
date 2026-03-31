import React from "react";
import { assets } from "../assets/assets";

const AppDownload = () => {
  return (
    <div className="flex justify-center my-10 px-4">
      <div className="w-full max-w-7xl bg-[#f0f0fc] rounded-2xl px-6 py-10 flex flex-col md:flex-row items-center justify-between shadow-lg">
        
        {/* Left Section */}
        <div className="md:w-1/2 space-y-4 text-center md:text-left">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 leading-snug">
            Download Mobile App For <br /> Better Experience
          </h2>

          <div className="flex gap-4 justify-center md:justify-start pt-2">
            <a href="#" className="hover:scale-105 transition-transform">
              <img
                src={assets.play_store}
                alt="Google Play Store"
                className="h-12"
              />
            </a>
            <a href="#" className="hover:scale-105 transition-transform">
              <img
                src={assets.app_store}
                alt="Apple App Store"
                className="h-12"
              />
            </a>
          </div>
        </div>

        {/* Right Section */}
        <div className="md:w-1/2 flex justify-center mt-6 md:mt-0">
          <img
            src={assets.app_main_img}
            alt="App Preview"
            className="w-60 md:w-72 object-contain drop-shadow-md"
          />
        </div>
      </div>
    </div>
  );
};

export default AppDownload;
