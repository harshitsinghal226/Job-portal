import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ClerkProvider } from "@clerk/clerk-react";

import App from "./App";
import { AppContextProvider } from "./context/AppContext";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

// Import your Clerk Publishable Key
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error("❌ Missing Clerk Publishable Key in .env file");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY} 
        afterSignOutUrl="/" 
        signInUrl="/sign-in"
        signUpUrl="/sign-up"
      >
        <BrowserRouter>
          <AppContextProvider>
            <App />
          </AppContextProvider>
        </BrowserRouter>
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>
);
