import mongoose from 'mongoose';

const adminSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
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
    permissions: [
      {
        type: String,
        enum: [
          'manage_students',
          'manage_teachers',
          'manage_courses',
          'manage_batches',
          'manage_fees',
          'manage_admissions',
          'manage_attendance',
          'manage_reports',
          'manage_settings',
          'manage_admins',
          'approve_applications',
          'generate_documents',
          'view_analytics',
          'all',
        ],
      },
    ],
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

// Index
adminSchema.index({ userId: 1 });

// Virtual to populate user data
adminSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Check permission method
adminSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes('all') || this.permissions.includes(permission);
};

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

export default Admin;
