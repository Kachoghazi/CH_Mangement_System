import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    category: {
      type: String,
      enum: ['general', 'institute', 'fees', 'attendance', 'notifications', 'reports', 'other'],
      default: 'general',
    },
    description: {
      type: String,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  {
    timestamps: true,
  },
);

// Index
settingsSchema.index({ key: 1 });
settingsSchema.index({ category: 1 });

// Get setting by key
settingsSchema.statics.get = async function (key, defaultValue = null) {
  const setting = await this.findOne({ key });
  return setting ? setting.value : defaultValue;
};

// Set setting
settingsSchema.statics.set = async function (key, value, options = {}) {
  const setting = await this.findOneAndUpdate(
    { key },
    {
      key,
      value,
      ...options,
    },
    { upsert: true, new: true },
  );
  return setting;
};

// Get all settings by category
settingsSchema.statics.getByCategory = function (category) {
  return this.find({ category });
};

// Get public settings
settingsSchema.statics.getPublic = function () {
  return this.find({ isPublic: true });
};

// Default settings
settingsSchema.statics.defaults = {
  // Institute settings
  'institute.name': 'CH Management System',
  'institute.address': '',
  'institute.phone': '',
  'institute.email': '',
  'institute.logo': '',
  'institute.website': '',

  // Academic settings
  'academic.currentYear': new Date().getFullYear().toString(),
  'academic.sessionStart': '07', // July
  'academic.sessionEnd': '06', // June

  // Fee settings
  'fees.lateFeeEnabled': true,
  'fees.lateFeeAmount': 50,
  'fees.lateFeeType': 'fixed',
  'fees.gracePeriodDays': 7,

  // Attendance settings
  'attendance.lateThresholdMinutes': 15,
  'attendance.minimumPercentage': 75,

  // Notification settings
  'notifications.smsEnabled': false,
  'notifications.emailEnabled': true,
  'notifications.feeReminder': true,
  'notifications.attendanceAlert': true,
};

// Initialize default settings
settingsSchema.statics.initDefaults = async function () {
  for (const [key, value] of Object.entries(this.defaults)) {
    const exists = await this.findOne({ key });
    if (!exists) {
      await this.create({
        key,
        value,
        category: key.split('.')[0],
        isPublic: key.startsWith('institute.'),
      });
    }
  }
};

const Settings = mongoose.models.Settings || mongoose.model('Settings', settingsSchema);

export default Settings;
