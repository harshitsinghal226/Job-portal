import React from 'react';
import { assets } from '../assets/assets';

const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-6">
      <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
        
        {/* Left Section: Logo + Copyright */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Logo */}
          <img src={assets.gem1} alt="Logo" className="w-40 h-11 object-contain" />

          {/* Text */}
          <span className="text-sm text-gray-500 text-center md:text-left">
            © {new Date().getFullYear()} <span className="font-semibold text-gray-700">TheCarrierHub.dev</span> | All rights reserved.
          </span>
        </div>

        {/* Right Section: Social Icons */}
        <div className="flex space-x-4 mt-4 md:mt-0">
          <a href="#" aria-label="Facebook" className="group">
            <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 group-hover:bg-black transition">
              <img src={assets.facebook_icon} alt="Facebook" className="w-4 h-4 group-hover:invert" />
            </div>
          </a>
          <a href="#" aria-label="Twitter" className="group">
            <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 group-hover:bg-black transition">
              <img src={assets.twitter_icon} alt="Twitter" className="w-4 h-4 group-hover:invert" />
            </div>
          </a>
          <a href="#" aria-label="Instagram" className="group">
            <div className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-400 group-hover:bg-black transition">
              <img src={assets.instagram_icon} alt="Instagram" className="w-4 h-4 group-hover:invert" />
            </div>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
