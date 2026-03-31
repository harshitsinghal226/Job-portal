import React, { createContext, useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useUser, useAuth } from "@clerk/clerk-react";
import EmailConflictResolver from "../components/EmailConflictResolver";

// Utility function for retrying failed requests
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Only retry on network errors
      if (error.code === 'ECONNABORTED' || 
          error.message.includes('timeout') || 
          error.message.includes('Network Error') || 
          error.code === 'ERR_NETWORK') {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      throw error;
    }
  }
};

export const AppContext = createContext();

export const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  
  // Validate backend URL is set
  if (!backendUrl) {
    console.error('❌ VITE_BACKEND_URL environment variable is not set!');
    console.error('❌ Please create a .env file in the client directory with VITE_BACKEND_URL=http://localhost:5000');
  } else {
    console.log('🌐 Backend URL:', backendUrl);
  }

  const { user } = useUser();
  const { getToken } = useAuth();

  const [searchFilter, setSearchFilter] = useState({
    title: "",
    location: "",
  });

  const [isSearched, setIsSearched] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [isJobsLoading, setIsJobsLoading] = useState(true);
  const [showRecruiterLogin, setShowRecruiterLogin] = useState(false);

  const [companyToken, setCompanyToken] = useState(localStorage.getItem("recruiterToken"));
  const [companyData, setCompanyData] = useState(null);

  // Update localStorage when companyToken changes
  useEffect(() => {
    if (companyToken) {
      localStorage.setItem("recruiterToken", companyToken);
    } else {
      localStorage.removeItem("recruiterToken");
    }
  }, [companyToken]);

  const [userData, setUserData] = useState(null);
  const [userApplications, setUserApplications] = useState([]);
  const [showEmailResolver, setShowEmailResolver] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);

  // Function to fetch jobs data
  const fetchJobs = useCallback(async () => {
    setIsJobsLoading(true);
    try {
      const { data } = await axios.get(backendUrl + "/api/jobs");

      if (data.success) {
        setJobs(data.jobs);
      } else {
        // Don't show toast for API errors, just log them
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
      
      // Handle different error types
      if (error.response?.status === 401) {
        return;
      } else if (error.response?.status === 500) {
        console.error("Server error fetching jobs:", error.response.data);
        return;
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        console.error("Network error fetching jobs:", error.message);
        return;
      }
      
      // Only show toast for unexpected client errors
      toast.error("Failed to fetch jobs. Please try again later.");
    } finally {
      setIsJobsLoading(false);
    }
  }, [backendUrl]);

  // Function to fetch company data
  const fetchCompanyData = useCallback(async () => {
    
    if (!companyToken) return;
    
    try {
      const { data } = await axios.get(`${backendUrl}/api/company/profile`, {
        headers: { token: companyToken },
      });

      if (data.success) {
        setCompanyData(data.company);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        // Token expired or invalid, clear it
        setCompanyToken(null);
        localStorage.removeItem("recruiterToken");
        return;
      }
      toast.error(error.response?.data?.message || error.message || "Failed to fetch company data");
    }
  }, [backendUrl, companyToken]);

  // Function to fetch user data
  const fetchUserData = useCallback(async () => {
    if (!user) {
      console.log("❌ No user object from Clerk");
      return;
    }

    try {
      console.log("🔍 Attempting to get token from Clerk...");
      const token = await getToken();
      console.log("🔑 Token received:", token ? "Yes" : "No");
      console.log("🔑 Token preview:", token ? token.substring(0, 20) + "..." : "No token");
      if (!token) {
        console.error("❌ No token available from Clerk");
        return;
      }

      const { data } = await axios.get(`${backendUrl}/api/users/data`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (data.success) {
        setUserData(data.user);
      } else {
        toast.error(data.message || "Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error(error.response?.data?.message || "Failed to fetch user data");
    }
  }, [user, backendUrl, getToken]);

  // Function to fetch user applications
  const fetchUserApplications = useCallback(async () => {
    if (!user) return;

    try {
      const token = await getToken();
      if (!token) {
        console.error("❌ No token available from Clerk");
        return;
      }

      const { data } = await retryRequest(async () => 
        axios.get(`${backendUrl}/api/users/applications`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        })
      );

      if (data.success) {
        setUserApplications(data.applications);
      } else {
        toast.error(data.message || "Failed to fetch applications");
      }
    } catch (error) {
      console.error("Error fetching applications:", error);
      
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error("Connection timeout while fetching applications. Please check your internet connection.");
      } else if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        toast.error("Network error while fetching applications. Please check your internet connection.");
      } else {
        toast.error(
          error.response?.data?.message || "Failed to fetch applications"
        );
      }
    }
  }, [user, backendUrl, getToken, userApplications.length]);

  // Function to sync user with backend
  const syncUser = useCallback(async () => {
    if (!user) return;

    // Prevent duplicate sync calls
    if (isSyncing) {
      return;
    }

    // If already synced successfully, don't sync again
    if (hasSynced) {
      return;
    }

    try {
      setIsSyncing(true);
      
      const token = await getToken();
      if (!token) {
        console.error("❌ No token available from Clerk");
        return;
      }

      if (!user.primaryEmailAddress?.emailAddress) {
        throw new Error("Email address is required");
      }

      console.log("🔄 Syncing user with backend:", backendUrl);
      const { data } = await retryRequest(async () => 
        axios.post(
          `${backendUrl}/api/users/sync`,
          {
            email: user.primaryEmailAddress.emailAddress,
            firstName: user.firstName || "",
            lastName: user.lastName || "",
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            timeout: 10000, // 10 second timeout
          }
        )
      );

      if (data.success) {
        setHasSynced(true);
        return data.user;
      } else {
        throw new Error(data.message || "Sync failed");
      }
    } catch (error) {
      console.error("❌ Error syncing user:", error);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        const errorMessage = error.response.data.message;
        if (errorMessage.includes("Email already registered")) {
          toast.info("Email conflict detected. Please resolve this to continue.");
          setShowEmailResolver(true);
          return; // Don't throw error, show resolver instead
        } else {
          toast.error(errorMessage);
        }
      } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error("Connection timeout. Please check your internet connection and try again.");
      } else if (error.message.includes('Network Error') || error.code === 'ERR_NETWORK') {
        toast.error("Network error. Please check your internet connection and try again.");
      } else {
        toast.error(error.response?.data?.message || "Failed to sync user");
      }
      
      throw error;
    } finally {
      setIsSyncing(false);
    }
  }, [user, backendUrl, getToken, isSyncing, hasSynced]);

  // Function to update user email (for conflict resolution)
  const updateUserEmail = useCallback(async (newEmail) => {
    if (!user) return;

    try {
      const token = await getToken();
      if (!token) {
        console.error("❌ No token available from Clerk");
        return;
      }

      const { data } = await axios.post(
        `${backendUrl}/api/users/update-email`,
        { newEmail },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (data.success) {
        toast.success("Email updated successfully");
        return data.user;
      } else {
        throw new Error(data.message || "Email update failed");
      }
    } catch (error) {
      console.error("❌ Error updating email:", error);
      toast.error(error.response?.data?.message || "Failed to update email");
      throw error;
    }
  }, [user, backendUrl, getToken]);

  // Function to retry user sync
  const retryUserSync = useCallback(async () => {
    if (!user || isSyncing) return;
    
    setHasSynced(false);
    setIsSyncing(false);
    
    try {
      const userData = await syncUser();
      if (userData) {
        fetchUserData();
        fetchUserApplications();
      }
    } catch (error) {
      console.error("❌ Retry sync failed:", error);
    }
  }, [user, isSyncing, syncUser, fetchUserData, fetchUserApplications]);

  // Function to refresh applications (clears cache and refetches)
  const refreshApplications = useCallback(async () => {
    if (!user) return;
    
    try {
      // Always fetch fresh data
      await fetchUserApplications();
    } catch (error) {
      console.error("❌ Failed to refresh applications:", error);
      toast.error("Failed to refresh applications");
    }
  }, [user, fetchUserApplications]);

  // Initial load
  useEffect(() => {
    fetchJobs();
    const storeCompanyToken = localStorage.getItem("recruiterToken");

    if (storeCompanyToken) {
      setCompanyToken(storeCompanyToken);
    }
  }, [fetchJobs]);

  useEffect(() => {
    if (companyToken) {
      fetchCompanyData();
    }
  }, [companyToken, fetchCompanyData]);

  useEffect(() => {
    if (user && !hasSynced && !isSyncing) {
      syncUser().then((userData) => {
        if (userData) {
          fetchUserData();
          fetchUserApplications();
        }
      }).catch((error) => {
        console.error("❌ User sync failed:", error);
        // Set hasSynced to true even on failure to prevent infinite retries
        setHasSynced(true);
      });
    }
  }, [user, hasSynced, isSyncing, syncUser, fetchUserData, fetchUserApplications]);

  // Reset sync state when user changes
  useEffect(() => {
    if (user) {
      setHasSynced(false);
      setIsSyncing(false);
    }
  }, [user]);

  // Function to clear user data when switching accounts
  const clearUserData = useCallback(() => {
    setUserData(null);
    setUserApplications([]);
    setHasSynced(false);
    setIsSyncing(false);
  }, []);

  const value = {
    searchFilter,
    setSearchFilter,
    isSearched,
    setIsSearched,
    jobs,
    setJobs,
    showRecruiterLogin,
    setShowRecruiterLogin,
    companyToken,
    setCompanyToken,
    companyData,
    setCompanyData,
    backendUrl,
    userData,
    setUserData,
    userApplications,
    setUserApplications,
    fetchUserData,
    fetchUserApplications,
    updateUserEmail,
    showEmailResolver,
    setShowEmailResolver,
    isSyncing,
    hasSynced,
    retryUserSync,
    fetchJobs,
    fetchCompanyData,
    refreshApplications,
          syncUser,
      clearUserData,
      isSignedIn: !!user,
      isJobsLoading,
    };

  return (
    <AppContext.Provider value={value}>
      {props.children}
      {showEmailResolver && (
        <EmailConflictResolver
          onResolved={() => {
            setShowEmailResolver(false);
            // Retry user sync after email update
            syncUser().then(() => {
              fetchUserData();
              fetchUserApplications();
            });
          }}
          onCancel={() => setShowEmailResolver(false)}
        />
      )}
    </AppContext.Provider>
  );
};
