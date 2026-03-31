import React from "react";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import JobListing from "../components/JobListing";
import AppDownload from "../components/AppDownload";
import Footer from "../components/Footer";

const Home = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content */}
      <main className="flex-1">
        <Hero />
        <JobListing />
        <AppDownload />
      </main>

      {/* Footer always at bottom */}
      <Footer />
    </div>
  );
};

export default Home;
