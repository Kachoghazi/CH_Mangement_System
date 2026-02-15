import mongoose, { Document, Model, models } from 'mongoose';

export type ApplicationStatus =
  | 'Draft'
  | 'Submitted'
  | 'UnderReview'
  | 'Approved'
  | 'Rejected'
  | 'InfoNeeded'
  | 'Waitlisted';

export interface IStudentApplication extends Document {
  _id: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  applicationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  cnic: string;
  dateOfBirth: Date;
  gender: 'Male' | 'Female' | 'Other';
  address: string;
  city?: string;
  educationBackground: string;
  lastInstitution?: string;
  lastGrade?: string;
  preferredCourse?: mongoose.Types.ObjectId;
  preferredBatch?: mongoose.Types.ObjectId;
  whyJoinBootcamp?: string;
  careerGoals?: string;
  howDidYouHear?: string;
  documents?: {
    cnicCopy?: string;
    photo?: string;
    educationCertificates?: string[];
  };
  status: ApplicationStatus;
  adminComment?: string;
  internalNotes?: string;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStudentApplicationMethods {
  softDelete(): Promise<IStudentApplication>;
  approve(reviewerId: mongoose.Types.ObjectId): Promise<IStudentApplication>;
  reject(reviewerId: mongoose.Types.ObjectId, reason: string): Promise<IStudentApplication>;
}

export type StudentApplicationModel = Model<
  IStudentApplication,
  object,
  IStudentApplicationMethods
>;

let applicationCounter = 1000;

const studentApplicationSchema = new mongoose.Schema<
  IStudentApplication,
  StudentApplicationModel,
  IStudentApplicationMethods
>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    applicationNumber: {
      type: String,
      required: [true, 'Application number is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
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
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    cnic: {
      type: String,
      required: [true, 'CNIC is required'],
      trim: true,
      match: [/^\d{5}-\d{7}-\d{1}$/, 'CNIC must be in format XXXXX-XXXXXXX-X'],
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
    },
    gender: {
      type: String,
      enum: {
        values: ['Male', 'Female', 'Other'],
        message: '{VALUE} is not a valid gender',
      },
      required: [true, 'Gender is required'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [300, 'Address cannot exceed 300 characters'],
    },
    city: {
      type: String,
      trim: true,
    },
    educationBackground: {
      type: String,
      required: [true, 'Education background is required'],
      trim: true,
    },
    lastInstitution: {
      type: String,
      trim: true,
    },
    lastGrade: {
      type: String,
      trim: true,
    },
    preferredCourse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
    },
    preferredBatch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Batch',
    },
    whyJoinBootcamp: {
      type: String,
      trim: true,
      maxlength: [2000, 'Response cannot exceed 2000 characters'],
    },
    careerGoals: {
      type: String,
      trim: true,
      maxlength: [2000, 'Response cannot exceed 2000 characters'],
    },
    howDidYouHear: {
      type: String,
      trim: true,
    },
    documents: {
      cnicCopy: { type: String },
      photo: { type: String },
      educationCertificates: [{ type: String }],
    },
    status: {
      type: String,
      enum: {
        values: [
          'Draft',
          'Submitted',
          'UnderReview',
          'Approved',
          'Rejected',
          'InfoNeeded',
          'Waitlisted',
        ],
        message: '{VALUE} is not a valid application status',
      },
      default: 'Draft',
      index: true,
    },
    adminComment: {
      type: String,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    internalNotes: {
      type: String,
      trim: true,
      maxlength: [2000, 'Notes cannot exceed 2000 characters'],
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    reviewedAt: {
      type: Date,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

studentApplicationSchema.index({ applicationNumber: 1 }, { unique: true });
studentApplicationSchema.index({ email: 1 });
studentApplicationSchema.index({ status: 1, createdAt: -1 });
studentApplicationSchema.index({ preferredCourse: 1, status: 1 });
studentApplicationSchema.index({ isDeleted: 1, createdAt: -1 });
studentApplicationSchema.index({ fullName: 'text', email: 'text' });

studentApplicationSchema.pre('save', async function () {
  if (this.isNew && !this.applicationNumber) {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    applicationCounter += 1;
    this.applicationNumber = `APP-${year}${month}-${applicationCounter.toString().padStart(4, '0')}`;
  }
});

studentApplicationSchema.methods.softDelete = async function (): Promise<IStudentApplication> {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

studentApplicationSchema.methods.approve = async function (
  reviewerId: mongoose.Types.ObjectId,
): Promise<IStudentApplication> {
  this.status = 'Approved';
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  return this.save();
};

studentApplicationSchema.methods.reject = async function (
  reviewerId: mongoose.Types.ObjectId,
  reason: string,
): Promise<IStudentApplication> {
  this.status = 'Rejected';
  this.adminComment = reason;
  this.reviewedBy = reviewerId;
  this.reviewedAt = new Date();
  return this.save();
};

studentApplicationSchema.pre('find', function () {
  this.where({ isDeleted: { $ne: true } });
});

studentApplicationSchema.pre('findOne', function () {
  this.where({ isDeleted: { $ne: true } });
});

export const StudentApplication =
  models?.StudentApplication ||
  mongoose.model<IStudentApplication, StudentApplicationModel>(
    'StudentApplication',
    studentApplicationSchema,
  );
