const Model = require('../models/Model');
const ViewerState = require('../models/ViewerState');
const supabaseService = require('../services/supabaseService');

/** GET /api/models?page=1&limit=12 */
async function listModels(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 12));
    const filter = { userId: req.user.id };

    const [items, total] = await Promise.all([
      Model.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Model.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: {
        models: items.map((m) => ({
          id: m._id.toString(),
          name: m.name,
          fileName: m.fileName,
          fileType: m.fileType,
          fileSize: m.fileSize,
          fileUrl: m.fileUrl,
          status: m.status,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        })),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) || 1 },
      },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * GET /api/models/:id
 * Returns a fresh presigned download URL for the private Supabase object.
 */
async function getModel(req, res, next) {
  try {
    const model = await Model.findOne({ _id: req.params.id, userId: req.user.id });
    if (!model) {
      const err = new Error('Model not found');
      err.statusCode = 404;
      throw err;
    }

    // Generate a fresh signed URL using Supabase
    const downloadUrl = await supabaseService.createPresignedDownloadUrl(model.storagePath);

    return res.json({
      success: true,
      data: { model: { ...model.toPublicJSON(), downloadUrl } },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * POST /api/models
 * Called after the browser has uploaded the file directly to Supabase.
 * The client must send storagePath, fileName, name, and fileSize.
 */
async function createModel(req, res, next) {
  try {
    const { name, fileName, storagePath, fileSize } = req.body;

    // Security: ensure the path belongs to the authenticated user
    if (!storagePath.startsWith(`models/${req.user.id}/`)) {
      const err = new Error('Invalid storage path for this user');
      err.statusCode = 403;
      throw err;
    }

    // Validate that the file size is within allowed limits (optional extra check)
    if (fileSize > supabaseService.MAX_UPLOAD_BYTES) {
      // If the uploaded file is too large, delete it from storage to avoid orphans
      await supabaseService.deleteObject(storagePath).catch(() => {});
      const err = new Error('Uploaded file exceeds the maximum allowed size');
      err.statusCode = 413;
      throw err;
    }

    // Create the model metadata in MongoDB
    const model = await Model.create({
      userId: req.user.id,
      name: name.trim(),
      fileName,
      fileType: supabaseService.getExtension(fileName),
      fileSize: Number(fileSize) || 0,
      storagePath,
      fileUrl: supabaseService.buildFileUrl(storagePath), // public URL (or signed if bucket is private)
      status: 'ready',
    });

    return res.status(201).json({
      success: true,
      message: 'Model uploaded',
      data: { model: model.toPublicJSON() },
    });
  } catch (err) {
    return next(err);
  }
}

/**
 * DELETE /api/models/:id
 * Removes the Supabase object, the metadata, and all saved views.
 */
async function deleteModel(req, res, next) {
  try {
    const model = await Model.findOne({ _id: req.params.id, userId: req.user.id });
    if (!model) {
      const err = new Error('Model not found');
      err.statusCode = 404;
      throw err;
    }

    // Delete the file from Supabase Storage
    try {
      await supabaseService.deleteObject(model.storagePath);
    } catch (e) {
      // Log the error but continue to delete metadata (orphaned file is preferable)
      console.error('Supabase delete failed for', model.storagePath, e.message);
    }

    // Remove the model metadata and all associated views
    await Promise.all([
      ViewerState.deleteMany({ modelId: model._id, userId: req.user.id }),
      model.deleteOne(),
    ]);

    return res.json({ success: true, message: 'Model deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listModels, getModel, createModel, deleteModel };