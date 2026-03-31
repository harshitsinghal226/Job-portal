// Navbar.jsx
import React, { useContext } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useUser,
} from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const { setShowRecruiterLogin } = useContext(AppContext);

  return (
    <div className="border-b border-gray-200 shadow-sm bg-white sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto flex justify-between items-center px-4 h-16">
        
        {/* LEFT: Logo (non-clickable) */}
        <div className="flex items-center gap-4">
          <img
            src={assets.gem1}
            alt="Career Hub Logo"
            className="h-12 w-auto object-contain"
          />
        </div>

        {/* RIGHT: Auth Buttons / User Info */}
        <div className="flex items-center gap-6 text-sm font-medium text-gray-700">
          
          {/* When logged out */}
          <SignedOut>
            <button
              onClick={() => setShowRecruiterLogin(true)}
              className="text-gray-600 hover:text-black transition"
            >
              Recruiter Login
            </button>
            <SignInButton mode="modal">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-1.5 rounded-full transition">
                Login
              </button>
            </SignInButton>
          </SignedOut>

          {/* When logged in */}
          <SignedIn>
            <Link
              to="/applications"
              className="hover:text-blue-600 transition"
            >
              Applied Jobs
            </Link>
            {user && (
              <span className="text-gray-600 hidden sm:inline">
                | Hi, {user.firstName || user.username || 'User'}
              </span>
            )}
            {/* Logout should redirect to home page */}
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
