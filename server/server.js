import './config/instrument.js';
import express from 'express';
import * as Sentry from '@sentry/node';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import connectDB from './config/db.js';
import connectcloudinary from './config/cloudinary.js';
import companyRoutes from './routes/companyRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import userRoutes from './routes/userRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import { clerk } from './config/clerk.js';
import { uploadImage } from './config/multer.js';
import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';

dotenv.config();
const app = express();

// --- MongoDB events ---
mongoose.connection.on('connected', () => console.log("✅ MongoDB connected"));
mongoose.connection.on('error', err => console.error("❌ MongoDB error:", err));

// --- Ensure uploads directory exists ---
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// --- Middleware ---
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : "*"
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(uploadsDir));

// --- Utility health check ---
app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// --- Root ---
app.get('/', (req, res) => res.send('✅ API is working'));

// --- Test route for debugging (development only) ---
if (process.env.NODE_ENV === 'development') {
  app.get('/test', (req, res) => {
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasMongoDB: mongoose.connection.readyState === 1,
        hasJWTSecret: !!process.env.JWT_SECRET,
        hasClerkSecret: !!process.env.CLERK_SECRET_KEY,
        hasCloudinary: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
      }
    });
  });
}

// --- Test file upload ---
app.post('/test-upload', uploadImage, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ message: 'File uploaded successfully', file: req.file });
});

// --- Clerk protected route ---
if (clerk) {
  app.get('/protected', ClerkExpressWithAuth(), (req, res) => {
    res.json({ userId: req.auth.userId });
  });
} else {
  app.get('/protected', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Authentication service not configured'
    });
  });
}

// --- API Routes ---
// Mount company and job routes
app.use('/api/company', companyRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/integration', integrationRoutes);

// User routes with Clerk authentication
if (clerk) {
  app.use('/api/users', ClerkExpressWithAuth({
    authorizedParties: ['http://localhost:5173', 'http://localhost:5000']
  }), userRoutes);
} else {
  app.use('/api/users', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Authentication service not configured'
    });
  });
}

// Debug middleware for unhandled routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// --- Multer & global error handler ---
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    return res.status(400).json({ error: error.message });
  }
  console.error("❌ Global error:", error);
  res.status(500).json({ error: error.message || 'Internal Server Error' });
});

// --- Sentry error handler (must be last middleware) ---
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// --- Start Server ---
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Load environment variables first
    if (!process.env.MONGODB_URI) {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/job_portal';
    }

    // Check JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('❌ JWT_SECRET environment variable is not set!');
      console.error('❌ Company authentication will not work without this!');
      process.exit(1);
    }

    // Connect to MongoDB
    await connectDB();

    // Connect to Cloudinary (optional for development)
    if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
      connectcloudinary();
    }

    // Start the server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

startServer();
