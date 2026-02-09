/**
 * Seed Default Admin User
 * Run with: node scripts/seed-admin.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ch_management';

// User Schema (inline to avoid import issues)
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

// Admin Schema
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
    },
    phone: {
      type: String,
    },
    permissions: {
      type: [String],
      default: ['all'],
    },
  },
  {
    timestamps: true,
  },
);

// Default admin credentials
const DEFAULT_ADMIN = {
  name: 'Administrator',
  email: 'admin@chmanagement.com',
  password: 'Admin@123',
  phone: '+92 300 1234567',
};

async function seedAdmin() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: 'ch_management_system' });
    console.log('✅ Connected to ch_management_system database');

    // Get or create models
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

    // Delete existing admin if exists (force recreate)
    const existingUser = await User.findOne({ email: DEFAULT_ADMIN.email.toLowerCase() });

    if (existingUser) {
      console.log('🔄 Found existing admin, recreating...');
      await Admin.deleteMany({ userId: existingUser._id });
      await User.deleteOne({ email: DEFAULT_ADMIN.email.toLowerCase() });
      console.log('🗑️  Deleted old admin user and profile');
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(DEFAULT_ADMIN.password, salt);

    // Create user
    console.log('👤 Creating admin user...');
    const user = new User({
      email: DEFAULT_ADMIN.email.toLowerCase(),
      passwordHash,
      role: 'admin',
      isActive: true,
      accountSource: 'admin_created',
    });
    await user.save();

    // Create admin profile
    console.log('📝 Creating admin profile...');
    const admin = new Admin({
      userId: user._id,
      name: DEFAULT_ADMIN.name,
      phone: DEFAULT_ADMIN.phone,
      permissions: ['all'],
    });
    await admin.save();

    console.log('\n✅ Default admin created successfully!');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:', DEFAULT_ADMIN.email);
    console.log('🔑 Password:', DEFAULT_ADMIN.password);
    console.log('═══════════════════════════════════════');
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

// Run the seed
seedAdmin()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
