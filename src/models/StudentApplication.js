import mongoose from 'mongoose';

const studentApplicationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    address: {
      street: String,
      city: String,
      state: String,
      pincode: String,
    },
    guardianName: {
      type: String,
      trim: true,
    },
    guardianPhone: {
      type: String,
      trim: true,
    },
    guardianRelation: {
      type: String,
      trim: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      // Not required for self-signup, can be set later
    },
    preferredBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    previousEducation: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    reviewedAt: {
      type: Date,
    },
    remarks: {
      type: String,
      trim: true,
    },
    documents: [
      {
        name: String,
        url: String,
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Indexes
studentApplicationSchema.index({ userId: 1 });
studentApplicationSchema.index({ status: 1 });
studentApplicationSchema.index({ courseId: 1 });
studentApplicationSchema.index({ createdAt: -1 });

// Virtual for course data
studentApplicationSchema.virtual('course', {
  ref: 'Course',
  localField: 'courseId',
  foreignField: '_id',
  justOne: true,
});

// Method to approve application
studentApplicationSchema.methods.approve = function (adminId, remarks = '') {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.remarks = remarks;
  return this.save();
};

// Method to reject application
studentApplicationSchema.methods.reject = function (adminId, remarks = '') {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.remarks = remarks;
  return this.save();
};

// Static to find pending applications
studentApplicationSchema.statics.findPending = function () {
  return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};

const StudentApplication =
  mongoose.models.StudentApplication ||
  mongoose.model('StudentApplication', studentApplicationSchema);

export default StudentApplication;
