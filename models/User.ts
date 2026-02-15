/**
 * User Model with Mongoose Discriminators
 *
 * DESIGN DECISIONS:
 *
 * 1. WHY SINGLE COLLECTION WITH DISCRIMINATORS?
 *    - Single 'users' collection simplifies authentication (one query to find any user)
 *    - Shared indexes on email, phone work across all user types
 *    - Easier to implement shared functionality (password reset, login, etc.)
 *    - MongoDB stores discriminator docs efficiently with __t field
 *    - Queries can target specific roles OR all users seamlessly
 *
 * 2. WHY DISCRIMINATORS VS ROLES ARRAY?
 *    - Discriminators provide type-safe role-specific fields at schema level
 *    - A roles array would require conditional validation and loose typing
 *    - Discriminators allow role-specific virtuals, methods, and middleware
 *    - Better IDE support and TypeScript integration
 *    - Cleaner code: Admin.find() vs User.find({ roles: 'admin' })
 *
 * 3. INDEXING STRATEGY:
 *    - email: unique index (authentication lookup)
 *    - isDeleted + role: compound for filtered queries
 *    - rollNumber: sparse index (only students have it)
 *    - phone: sparse index (optional field)
 *    - Compound indexes chosen based on common query patterns
 *
 * 4. TRADE-OFFS:
 *    PROS:
 *    - Single auth endpoint, simpler JWT/session logic
 *    - Atomic user creation (no cross-collection refs)
 *    - Easy to add new roles via discriminators
 *    - Shared middleware (soft-delete, timestamps) applied once
 *
 *    CONS:
 *    - Large collection if millions of users (but MongoDB handles this well)
 *    - Role-specific indexes may be sparse
 *    - Migration complexity if roles need to change dynamically
 *    - All role data in one collection (less separation of concerns)
 */

import mongoose, { Document, Model, models, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type UserRole = 'admin' | 'teacher' | 'student';
export type Gender = 'Male' | 'Female' | 'Other';
export type AdminLevel = 1 | 2 | 3; // 1=SuperAdmin, 2=Admin, 3=Moderator

// Base User Interface (shared fields)
export interface IUserBase {
  _id: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  profilePictureUrl?: string;
  role: UserRole;
  lastLogin?: Date;
  refreshToken?: string;
  isActive: boolean;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Admin-specific fields
export interface IAdmin extends IUserBase {
  role: 'admin';
  adminLevel: AdminLevel;
  permissions: string[];
  department?: string;
  canManageAdmins: boolean;
}

// Teacher-specific fields
export interface ITeacher extends IUserBase {
  role: 'teacher';
  subjectsTaught: string[];
  qualifications: string[];
  experienceYears?: number;
  specialization?: string;
  joiningDate: Date;
  employeeId?: string;
  assignedBatches: mongoose.Types.ObjectId[];
}

// Student-specific fields
export interface IStudent extends IUserBase {
  role: 'student';
  rollNumber?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  address?: string;
  city?: string;
  admissionDate: Date;
  enrolledBatches: mongoose.Types.ObjectId[];
  bloodGroup?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

// Union type for all user types
export type IUser = IAdmin | ITeacher | IStudent;

// Method interfaces
export interface IUserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  updateLastLogin(): Promise<IUserBase>;
  softDelete(): Promise<IUserBase>;
  generateAuthToken?(): string;
}

// Model types
export type UserBaseModel = Model<IUserBase, object, IUserMethods>;
export type AdminModel = Model<IAdmin, object, IUserMethods>;
export type TeacherModel = Model<ITeacher, object, IUserMethods>;
export type StudentModel = Model<IStudent, object, IUserMethods>;

interface IStudentVirtuals {
  age: number | null;
  isMinor: boolean;
  enrolledBatchCount: number;
}

// =============================================================================
// BASE USER SCHEMA
// =============================================================================

const userBaseSchema = new Schema<IUserBase, UserBaseModel, IUserMethods>(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never return password by default
    },
    phone: {
      type: String,
      trim: true,
      sparse: true,
      match: [/^\+?[\d\s-]{10,15}$/, 'Please provide a valid phone number'],
    },
    profilePictureUrl: {
      type: String,
      trim: true,
    },
    lastLogin: {
      type: Date,
    },
    refreshToken: {
      type: String,
      select: false, // Security: don't expose refresh tokens
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    discriminatorKey: 'role', // This tells Mongoose to use 'role' for discriminators
    collection: 'users',
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: Record<string, unknown>) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  },
);

// =============================================================================
// INDEXES
// =============================================================================

// Compound index for common queries
userBaseSchema.index({ role: 1, isActive: 1, isDeleted: 1 });
userBaseSchema.index({ isDeleted: 1, createdAt: -1 });
userBaseSchema.index({ email: 1, isDeleted: 1 });

// Text index for search functionality
userBaseSchema.index({ fullName: 'text', email: 'text' });

// =============================================================================
// VIRTUALS
// =============================================================================

// Virtual for display name (could be extended for different formats)
userBaseSchema.virtual('displayName').get(function (this: IUserBase) {
  return this.fullName;
});

// Virtual for checking if user can login
userBaseSchema.virtual('canLogin').get(function (this: IUserBase) {
  return this.isActive && !this.isDeleted;
});

// =============================================================================
// INSTANCE METHODS
// =============================================================================

userBaseSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  // Need to explicitly select password since it's select: false
  const user = await User.findById(this._id).select('+password');
  if (!user || !user.password) return false;
  return bcrypt.compare(candidatePassword, user.password);
};

userBaseSchema.methods.updateLastLogin = async function (): Promise<IUserBase> {
  this.lastLogin = new Date();
  return this.save();
};

userBaseSchema.methods.softDelete = async function (): Promise<IUserBase> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.isActive = false;
  return this.save();
};

// =============================================================================
// MIDDLEWARE (HOOKS)
// =============================================================================

// Pre-save: Hash password and normalize email
userBaseSchema.pre('save', async function () {
  // Ensure email is lowercase (redundant with schema but explicit)
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase().trim();
  }

  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Query middleware: Auto-filter soft-deleted users on find operations
userBaseSchema.pre('find', function () {
  // Only apply if not explicitly querying for deleted users
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
});

userBaseSchema.pre('findOne', function () {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
});

userBaseSchema.pre('countDocuments', function () {
  const query = this.getQuery();
  if (query.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
});

// =============================================================================
// STATICS
// =============================================================================

userBaseSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

userBaseSchema.statics.findActiveUsers = function () {
  return this.find({ isActive: true, isDeleted: false });
};

// =============================================================================
// BASE USER MODEL
// =============================================================================

const User = models?.User || mongoose.model<IUserBase, UserBaseModel>('User', userBaseSchema);

// =============================================================================
// ADMIN DISCRIMINATOR SCHEMA
// =============================================================================

const adminSchema = new Schema<IAdmin>(
  {
    adminLevel: {
      type: Number,
      enum: {
        values: [1, 2, 3],
        message: 'Admin level must be 1 (SuperAdmin), 2 (Admin), or 3 (Moderator)',
      },
      default: 2,
    },
    permissions: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          const validPermissions = [
            'users:read',
            'users:write',
            'users:delete',
            'batches:read',
            'batches:write',
            'batches:delete',
            'payments:read',
            'payments:write',
            'payments:refund',
            'reports:view',
            'reports:export',
            'settings:manage',
            'admins:manage',
          ];
          return v.every((p) => validPermissions.includes(p) || p.match(/^[a-z]+:[a-z]+$/));
        },
        message: 'Invalid permission format',
      },
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters'],
    },
    canManageAdmins: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false, // Discriminator schemas share _id with base
  },
);

// Admin-specific virtuals
adminSchema.virtual('isSuperAdmin').get(function (this: IAdmin) {
  return this.adminLevel === 1;
});

// Admin-specific methods
adminSchema.methods.hasPermission = function (permission: string): boolean {
  if (this.adminLevel === 1) return true; // SuperAdmin has all permissions
  return this.permissions.includes(permission);
};

// =============================================================================
// TEACHER DISCRIMINATOR SCHEMA
// =============================================================================

const teacherSchema = new Schema<ITeacher>(
  {
    subjectsTaught: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 20;
        },
        message: 'Cannot teach more than 20 subjects',
      },
    },
    qualifications: {
      type: [String],
      default: [],
      validate: {
        validator: function (v: string[]) {
          return v.length <= 10;
        },
        message: 'Cannot have more than 10 qualifications listed',
      },
    },
    experienceYears: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      max: [60, 'Experience cannot exceed 60 years'],
    },
    specialization: {
      type: String,
      trim: true,
      maxlength: [200, 'Specialization cannot exceed 200 characters'],
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    employeeId: {
      type: String,
      trim: true,
      sparse: true,
    },
    assignedBatches: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
  },
  {
    _id: false,
  },
);

// Teacher-specific indexes
teacherSchema.index({ subjectsTaught: 1 });
teacherSchema.index({ employeeId: 1 }, { sparse: true });
teacherSchema.index({ assignedBatches: 1 });

// Teacher-specific virtuals
teacherSchema.virtual('subjectsCount').get(function (this: ITeacher) {
  return this.subjectsTaught?.length || 0;
});

teacherSchema.virtual('experienceLevel').get(function (this: ITeacher) {
  const years = this.experienceYears || 0;
  if (years >= 15) return 'Senior';
  if (years >= 7) return 'Mid-Level';
  if (years >= 2) return 'Junior';
  return 'Fresher';
});

// =============================================================================
// STUDENT DISCRIMINATOR SCHEMA
// =============================================================================

const studentSchema = new Schema<IStudent>(
  {
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true, // Allows null/undefined, but unique when present
      index: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Other', null],
        message: '{VALUE} is not a valid gender',
      },
    },
    parentName: {
      type: String,
      trim: true,
      maxlength: [100, 'Parent name cannot exceed 100 characters'],
    },
    parentPhone: {
      type: String,
      trim: true,
      match: [/^\+?[\d\s-]{10,15}$/, 'Please provide a valid phone number'],
    },
    parentEmail: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    city: {
      type: String,
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    enrolledBatches: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Batch',
      },
    ],
    bloodGroup: {
      type: String,
      enum: {
        values: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', null],
        message: '{VALUE} is not a valid blood group',
      },
    },
    emergencyContact: {
      name: { type: String, trim: true },
      phone: { type: String, trim: true },
      relationship: { type: String, trim: true },
    },
  },
  {
    _id: false,
  },
);

// Student-specific indexes
studentSchema.index({ rollNumber: 1 }, { sparse: true, unique: true });
studentSchema.index({ enrolledBatches: 1 });
studentSchema.index({ admissionDate: -1 });
studentSchema.index({ city: 1 });

// Student-specific virtuals
studentSchema.virtual('age').get(function (this: IStudent) {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
});

studentSchema.virtual('isMinor').get(function (this: IStudent & IStudentVirtuals) {
  const age = this.age;
  return age !== null && age < 18;
});

studentSchema.virtual('enrolledBatchCount').get(function (this: IStudent) {
  return this.enrolledBatches?.length || 0;
});

// =============================================================================
// CREATE DISCRIMINATOR MODELS
// =============================================================================

// Check if discriminators already exist (for Next.js hot reloading)
const Admin =
  (User.discriminators?.admin as AdminModel) || User.discriminator('admin', adminSchema);

const Teacher =
  (User.discriminators?.teacher as TeacherModel) || User.discriminator('teacher', teacherSchema);

const Student =
  (User.discriminators?.student as StudentModel) || User.discriminator('student', studentSchema);

// =============================================================================
// EXPORTS
// =============================================================================

export default User;

export { User, Admin, Teacher, Student, userBaseSchema, adminSchema, teacherSchema, studentSchema };

// Type guard utilities for runtime type checking
export const isAdmin = (user: IUserBase): user is IAdmin => user.role === 'admin';
export const isTeacher = (user: IUserBase): user is ITeacher => user.role === 'teacher';
export const isStudent = (user: IUserBase): user is IStudent => user.role === 'student';

/**
 * =============================================================================
 * USAGE EXAMPLES
 * =============================================================================
 *
 * // Create an admin
 * const admin = await Admin.create({
 *   fullName: 'Super Admin',
 *   email: 'admin@school.com',
 *   password: 'securepassword',
 *   adminLevel: 1,
 *   permissions: ['users:write', 'settings:manage']
 * });
 *
 * // Create a teacher
 * const teacher = await Teacher.create({
 *   fullName: 'John Smith',
 *   email: 'john@school.com',
 *   password: 'teacherpass',
 *   subjectsTaught: ['Mathematics', 'Physics'],
 *   experienceYears: 10
 * });
 *
 * // Create a student
 * const student = await Student.create({
 *   fullName: 'Jane Doe',
 *   email: 'jane@student.com',
 *   password: 'studentpass',
 *   rollNumber: 'STU-2026-001',
 *   dateOfBirth: new Date('2010-05-15'),
 *   gender: 'Female'
 * });
 *
 * // Query all users (any role)
 * const allUsers = await User.find({ isActive: true });
 *
 * // Query only teachers
 * const teachers = await Teacher.find({ experienceYears: { $gte: 5 } });
 *
 * // Query by role using base model
 * const admins = await User.find({ role: 'admin' });
 *
 * // Use type guards
 * const user = await User.findById(id);
 * if (isStudent(user)) {
 *   console.log(user.rollNumber); // TypeScript knows this is IStudent
 * }
 *
 * =============================================================================
 */
