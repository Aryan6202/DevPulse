const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert'],
      default: 'Beginner',
    },
    progress: { type: Number, min: 0, max: 100, default: 0 },
  },
  { _id: false }
);

const userProfileSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // never returned by default queries
    },
    githubUsername: {
      type: String,
      trim: true,
      default: '',
    },
    bio: {
      type: String,
      maxlength: 300,
      default: '',
    },
    skills: {
      type: [skillSchema],
      default: [],
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    subscriptionTier: {
      type: String,
      enum: ['free', 'pro'],
      default: 'free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('UserProfile', userProfileSchema);
