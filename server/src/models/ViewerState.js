const mongoose = require('mongoose');

const vector3Schema = new mongoose.Schema(
  {
    x: { type: Number, required: true },
    y: { type: Number, required: true },
    z: { type: Number, required: true },
  },
  { _id: false }
);

const viewerStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Model',
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    camera: {
      position: { type: vector3Schema, required: true },
      rotation: { type: vector3Schema, required: true },
      zoom: { type: Number, default: 1 },
    },
    target: { type: vector3Schema, required: true },
  },
  { timestamps: true }
);

// Saved views are always queried by owner + model.
viewerStateSchema.index({ userId: 1, modelId: 1, createdAt: -1 });
viewerStateSchema.index({ userId: 1, modelId: 1, name: 1 }, { unique: true });

viewerStateSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    modelId: this.modelId.toString(),
    name: this.name,
    camera: {
      position: this.camera.position,
      rotation: this.camera.rotation,
      zoom: this.camera.zoom,
    },
    target: this.target,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('ViewerState', viewerStateSchema);
