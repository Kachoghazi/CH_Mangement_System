import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    accountSource: {
      type: String,
      enum: ['self_signup', 'admin_created'],
      default: 'self_signup',
    },
    lastLoginAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Virtual for checking if user can login
userSchema.virtual('canLogin').get(function () {
  return this.isActive && !this.deletedAt;
});

// Method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true, deletedAt: null });
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;
