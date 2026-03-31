import mongoose from 'mongoose';

const jobApplicationSchema = new mongoose.Schema({
  // For user applications with Clerk auth
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional for backward compatibility
  },

  // For simple applications without user auth
  name: {
    type: String,
    required: function () {
      return !this.userId; // Required only if no userId
    }
  },

  email: {
    type: String,
    required: function () {
      return !this.userId; // Required only if no userId
    }
  },

  phone: {
    type: String,
    default: null
  },

  resume: {
    type: String,
    default: null
  },

  coverLetter: {
    type: String,
    default: ""
  },

  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  }, // Reference to Job model

  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  }, // Reference to Company model

  status: {
    type: String,
    enum: ['pending', 'reviewed', 'accepted', 'rejected'],
    default: 'pending'
  },

  appliedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const JobApplication = mongoose.model('JobApplication', jobApplicationSchema);

export default JobApplication;
