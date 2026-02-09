import mongoose from 'mongoose';

const generatedDocumentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'fee_invoice',
        'payment_receipt',
        'admission_form',
        'id_card',
        'transfer_certificate',
        'attendance_report',
        'fee_report',
        'student_report',
        'batch_report',
        'certificate',
        'other',
      ],
      required: true,
    },
    entityType: {
      type: String,
      enum: ['student', 'teacher', 'invoice', 'admission', 'batch', 'course', 'other'],
      required: true,
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
    },
    fileSize: {
      type: Number, // in bytes
    },
    mimeType: {
      type: String,
      default: 'application/pdf',
    },
    // Snapshot of data used to generate the document
    // This ensures historical accuracy of the document
    snapshotData: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    template: {
      type: String,
      trim: true,
    },
    // Storage info
    storageType: {
      type: String,
      enum: ['local', 's3', 'cloudinary', 'firebase', 'other'],
      default: 'local',
    },
    storagePath: {
      type: String,
    },
    storageKey: {
      type: String,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    lastDownloadedAt: {
      type: Date,
    },
    generatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
generatedDocumentSchema.index({ type: 1 });
generatedDocumentSchema.index({ entityType: 1, entityId: 1 });
generatedDocumentSchema.index({ generatedAt: -1 });
generatedDocumentSchema.index({ generatedBy: 1 });
generatedDocumentSchema.index({ fileName: 'text' });

// Increment download count
generatedDocumentSchema.methods.trackDownload = function () {
  this.downloadCount++;
  this.lastDownloadedAt = new Date();
  return this.save();
};

// Find documents by entity
generatedDocumentSchema.statics.findByEntity = function (entityType, entityId) {
  return this.find({ entityType, entityId }).sort({ generatedAt: -1 });
};

// Find by type
generatedDocumentSchema.statics.findByType = function (type) {
  return this.find({ type }).sort({ generatedAt: -1 });
};

// Find recent documents
generatedDocumentSchema.statics.findRecent = function (limit = 10) {
  return this.find({ isArchived: false }).sort({ generatedAt: -1 }).limit(limit);
};

// Archive old documents
generatedDocumentSchema.statics.archiveOld = function (daysOld = 365) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  return this.updateMany(
    { generatedAt: { $lt: cutoffDate }, isArchived: false },
    { $set: { isArchived: true } },
  );
};

const GeneratedDocument =
  mongoose.models.GeneratedDocument || mongoose.model('GeneratedDocument', generatedDocumentSchema);

export default GeneratedDocument;
