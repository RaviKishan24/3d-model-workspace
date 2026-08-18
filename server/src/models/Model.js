const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    fileName: { type: String, required: true },
    fileType: { type: String, required: true }, // glb | gltf | obj
    fileSize: { type: Number, required: true, min: 1 },
   storagePath: { type: String, required: true, unique: true },
    fileUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'ready'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Dashboard lists models per user, newest first.
modelSchema.index({ userId: 1, createdAt: -1 });

modelSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    fileName: this.fileName,
    fileType: this.fileType,
    fileSize: this.fileSize,
   storagePath: this.storagePath,
    fileUrl: this.fileUrl,
    status: this.status,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('Model', modelSchema);
