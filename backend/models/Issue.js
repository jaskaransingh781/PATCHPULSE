import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
  // Core Tracking
  reporterId: {
    type: String,
    required: false
  },
  mediaUrl: {
    type: String,
    required: true
  },
  
  // Geospatial Indexing
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },

  // AI Triage Data
  category: {
    type: String,
    required: true
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'Critical'],
    required: true
  },
  aiDescription: {
    type: String,
    required: true
  },

  // Issue Tracking
  status: {
    type: String,
    enum: ['Reported', 'Verified', 'In Progress', 'Resolved'],
    default: 'Reported'
  },
  upvotes: {
    type: Number,
    default: 0
  },

  // Extension 1: Image Integrity Tracking
  authenticityScore: {
    type: Number,
    default: 100
  },
  isFlaggedManipulated: {
    type: Boolean,
    default: false
  },

  // Extension 2: Human Context
  reporterNotes: {
    type: String,
    required: false
  },

  // Extension 3: Human-Readable Location
  wardOrDistrict: {
    type: String,
    required: false
  },

  // Extension 4: Resolution Accountability
  resolvedAt: {
    type: Date,
    required: false
  },
  resolutionProofUrl: {
    type: String,
    required: false
  }

}, { timestamps: true });

// Add the 2dsphere index for geospatial proximity queries
issueSchema.index({ location: '2dsphere' });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
