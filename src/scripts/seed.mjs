import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://devproejazali34_db_user:9QPW1Vo5uwKZVPLk@chatapp.cxnxepp.mongodb.net/?appName=chatapp';

// Define schemas inline for the seed script
const userSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['admin', 'teacher', 'student'], required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    accountSource: {
      type: String,
      enum: ['self_signup', 'admin_created'],
      default: 'admin_created',
    },
  },
  { timestamps: true },
);

const adminSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    phone: String,
    permissions: [String],
  },
  { timestamps: true },
);

const courseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, unique: true },
    description: String,
    durationMonths: { type: Number, required: true },
    totalFee: { type: Number, default: 0 },
    admissionFee: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, { dbName: 'ch_management_system' });
    console.log('Connected to ch_management_system database!');

    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
    const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

    // Force recreate admin user (delete existing and create fresh)
    console.log('\nCreating admin user...');
    const adminEmail = 'admin@chms.com';
    const adminPassword = 'admin123';

    // Delete existing admin user and profile to ensure fresh creation
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log('Found existing admin user, recreating...');
      await Admin.deleteMany({ userId: existingUser._id });
      await User.deleteOne({ email: adminEmail });
      console.log('Deleted old admin user and profile');
    }

    // Create new admin user
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const adminUser = new User({
      email: adminEmail,
      passwordHash,
      role: 'admin',
      isActive: true,
      accountSource: 'admin_created',
    });
    await adminUser.save();
    console.log(`Admin user created: ${adminEmail}`);

    // Create admin profile
    const adminProfile = new Admin({
      userId: adminUser._id,
      name: 'System Administrator',
      phone: '1234567890',
      permissions: ['all'],
    });
    await adminProfile.save();
    console.log('Admin profile created');

    // Create sample courses
    console.log('\nCreating sample courses...');
    const courses = [
      {
        name: 'Web Development',
        code: 'WEB001',
        durationMonths: 6,
        totalFee: 25000,
        admissionFee: 5000,
      },
      {
        name: 'Data Science',
        code: 'DS001',
        durationMonths: 8,
        totalFee: 35000,
        admissionFee: 7000,
      },
      {
        name: 'Python Programming',
        code: 'PY001',
        durationMonths: 4,
        totalFee: 15000,
        admissionFee: 3000,
      },
      {
        name: 'Mobile App Development',
        code: 'MOB001',
        durationMonths: 6,
        totalFee: 30000,
        admissionFee: 6000,
      },
      {
        name: 'Cloud Computing',
        code: 'CLD001',
        durationMonths: 5,
        totalFee: 28000,
        admissionFee: 5000,
      },
    ];

    for (const courseData of courses) {
      const exists = await Course.findOne({ code: courseData.code });
      if (!exists) {
        const course = new Course(courseData);
        await course.save();
        console.log(`Course created: ${courseData.name}`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('\n⚠️  Please change the admin password after first login!');
  } catch (error) {
    console.error('Seed error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

seed();
