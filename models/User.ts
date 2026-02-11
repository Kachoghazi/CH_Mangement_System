import mongoose, { model, models } from 'mongoose';
import bcrypt from 'bcrypt';
export interface IUser {
  _id?: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'student' | 'teacher' | 'admin';
  isActive?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'admin'],
      default: 'student',
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      minlength: 10,
      maxlength: 15,
    },
    lastLogin: {
      type: Date,
    },
  },

  { timestamps: true },
);

userSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save();
};
userSchema.methods.comparePassword = async function (candidatePassword: string) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.index({ email: 1 });

const User = models?.User || model<IUser>('User', userSchema);

export default User;
