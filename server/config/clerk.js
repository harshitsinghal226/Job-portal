import { Clerk } from '@clerk/clerk-sdk-node';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Check for required environment variables
if (!process.env.CLERK_SECRET_KEY) {
  console.warn("⚠️ Missing CLERK_SECRET_KEY environment variable");
  console.warn("Find this in your Clerk Dashboard under API Keys -> Secret Key");
  console.warn("Continuing without Clerk for development...");
}

// Initialize Clerk with available configuration
export const clerk = process.env.CLERK_SECRET_KEY ? Clerk({
  secretKey: process.env.CLERK_SECRET_KEY,
  publishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
  apiUrl: process.env.CLERK_API_URL || "https://api.clerk.dev",
  apiVersion: "v1"
}) : null;
