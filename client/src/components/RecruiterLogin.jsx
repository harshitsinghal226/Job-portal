// RecruiterLogin.jsx
import React, { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const RecruiterLogin = ({ onClose }) => {
  const [state, setState] = useState("Login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [logo, setLogo] = useState(null);
  const [isTextDataSubmitted, setIsTextDataSubmitted] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [isForgotPasswordSent, setIsForgotPasswordSent] = useState(false);
  const [accessMsg, setAccessMsg] = useState("");

  const navigate = useNavigate();
  const { backendUrl, setShowRecruiterLogin, setCompanyToken } = useContext(AppContext);

  // ✅ handle forgot password
  const handleForgotPassword = async () => {
    try {
      if (!backendUrl) {
        alert("Backend URL is not configured. Please set VITE_BACKEND_URL in client/.env");
        return;
      }
      if (!forgotPasswordEmail) {
        alert("Please enter your company email");
        return;
      }
      
      // Send forgot password request to backend
      const { data } = await axios.post(`${backendUrl}/api/company/forgot-password`, {
        email: forgotPasswordEmail,
      });
      
      if (data.success) {
        setIsForgotPasswordSent(true);
        alert("Password reset email sent! Please check your inbox.");
      } else {
        alert(data.message || "Failed to send reset email");
      }
    } catch (error) {
      console.error("Forgot password error:", error);
      const errorMessage = error.response?.data?.message || error.message || "Failed to send reset email";
      alert("Error: " + errorMessage);
    }
  };

  // ✅ handle login
  const handleLogin = async () => {
    try {
      if (!backendUrl) {
        alert("Backend URL is not configured. Please set VITE_BACKEND_URL in client/.env");
        return;
      }
      if (!email || !password) {
        alert("Please fill all fields");
        return;
      }
      
      const { data } = await axios.post(`${backendUrl}/api/company/login`, {
        email,
        password,
      });
      localStorage.setItem("recruiterToken", data.token);
      setCompanyToken(data.token);
      setShowRecruiterLogin(false);
      // Navigate to company dashboard instead of user dashboard
      navigate("/dashboard/add-job");
    } catch (error) {
      console.error("Login error details:", {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      if (status === 403) {
        setAccessMsg(errorMessage || "This is only accessible for Recruiter.");
        return;
      }
      alert("Login failed: " + errorMessage);
    }
  };

  // ✅ handle signup
  const handleSignup = async () => {
    try {
      if (!backendUrl) {
        alert("Backend URL is not configured. Please set VITE_BACKEND_URL in client/.env");
        return;
      }
      if (!isTextDataSubmitted) {
              if (!name || !email || !password) {
        alert("Please fill all fields");
        return;
      }
        setIsTextDataSubmitted(true);
        return;
      }

      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (logo) formData.append("image", logo);

      const { data } = await axios.post(
        `${backendUrl}/api/company/register`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      localStorage.setItem("recruiterToken", data.token);
      setCompanyToken(data.token);
      setShowRecruiterLogin(false);
      // Navigate to company dashboard instead of user dashboard
      navigate("/dashboard/add-job");
    } catch (error) {
      console.error("Signup error details:", {
        response: error.response?.data,
        status: error.response?.status,
        message: error.message
      });
      
      const status = error.response?.status;
      const errorMessage = error.response?.data?.message || error.message || "Unknown error occurred";
      if (status === 403) {
        setAccessMsg(errorMessage || "This is only accessible for Recruiter.");
        return;
      }
      alert("Signup failed: " + errorMessage);
    }
  };

  // ✅ submit handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (state === "Login") {
      handleLogin();
    } else {
      handleSignup();
    }
  };

  // ✅ button text logic
  const buttonText =
    state === "Login" ? "Login" : isTextDataSubmitted ? "Create Account" : "Next";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center px-4 z-50">
      <div className="bg-white w-full max-w-md rounded-xl shadow-lg p-6 relative animate-fadeIn">
        
        {/* Close button */}
        <button
          onClick={() => {
            // Reset form when closing
            setName("");
            setEmail("");
            setPassword("");
            setLogo(null);
            setIsTextDataSubmitted(false);
            setForgotPasswordEmail("");
            setIsForgotPasswordSent(false);
            setAccessMsg("");
            setState("Login");
            onClose();
          }}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 transition"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-1 text-center">
          {state === "Login" ? "Recruiter Login" : "Recruiter Signup"}
        </h2>
        <p className="text-center text-gray-500 text-sm mb-6">
          {state === "Login"
            ? "Welcome back! Please log in to continue."
            : "Create your recruiter account in just a few steps."}
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Forgot Password Form - Show only this when in forgot password mode */}
          {state === "ForgotPassword" ? (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Reset Password</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your company email to receive a password reset link
                </p>
              </div>
              
              <input
                type="email"
                placeholder="Company Email"
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full py-2.5 transition"
              >
                Send Reset Email
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setState("Login");
                  setForgotPasswordEmail("");
                  setIsForgotPasswordSent(false);
                }}
                className="w-full text-blue-600 hover:text-blue-700 text-sm transition"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <>
              {/* Company Name (only for signup step 1) */}
              {state !== "Login" && !isTextDataSubmitted && (
                <input
                  required
                  type="text"
                  placeholder="Company Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {/* Company Email (only for signup step 1) */}
              {state !== "Login" && !isTextDataSubmitted && (
                <input
                  required
                  type="email"
                  placeholder="Company Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-full px-4 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {/* Company Email (for login) */}
              {state === "Login" && (
                <input
                  required
                  type="email"
                  placeholder="Company Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {/* Password */}
              {(!isTextDataSubmitted || state === "Login") && (
                <input
                  required
                  type="password"
                  placeholder="Password"
                  value={password}
                  autoComplete={state === "Login" ? "current-password" : "new-password"}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-300 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {/* Forgot password link (only on Login state) */}
              {state === "Login" && (
                <div className="text-right -mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setState("ForgotPassword");
                      setForgotPasswordEmail(email);
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {/* Logo Upload (only after text step in signup) */}
              {state === "Signup" && isTextDataSubmitted && (
                <div className="flex flex-col items-center gap-3">
                  <label className="text-sm text-gray-600">Upload Company Logo</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setLogo(e.target.files[0])}
                    className="text-sm"
                  />
                </div>
              )}



              {/* Submit Button - only show for Login and Signup */}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full py-2.5 transition"
              >
                {buttonText}
              </button>
              {accessMsg && (
                <p className="mt-2 text-center text-sm text-red-600">
                  {accessMsg || "This is only accessible for Recruiter."}
                </p>
              )}
            </>
          )}
        </form>

        {/* Switch between Login/Signup */}
        <div className="mt-4 text-center text-sm text-gray-600">
          {state === "Login" ? (
            <>
              Don’t have an account?{" "}
              <span
                onClick={() => {
                  setState("Signup");
                  setIsTextDataSubmitted(false);
                  setName("");
                  setEmail("");
                  setPassword("");
                  setLogo(null);
                  setAccessMsg("");
                }}
                className="text-blue-600 font-medium cursor-pointer hover:underline"
              >
                Sign Up
              </span>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <span
                onClick={() => {
                  setState("Login");
                  setName("");
                  setEmail("");
                  setPassword("");
                  setLogo(null);
                  setAccessMsg("");
                }}
                className="text-blue-600 font-medium cursor-pointer hover:underline"
              >
                Login
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecruiterLogin;
