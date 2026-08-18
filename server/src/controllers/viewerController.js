const Model = require('../models/Model');
const ViewerState = require('../models/ViewerState');

/** Throws 404 unless the model exists AND belongs to the caller. */
async function assertOwnedModel(modelId, userId) {
  const model = await Model.findOne({ _id: modelId, userId }).select('_id').lean();
  if (!model) {
    const err = new Error('Model not found');
    err.statusCode = 404;
    throw err;
  }
  return model;
}

/** GET /api/models/:modelId/views */
async function listViews(req, res, next) {
  try {
    await assertOwnedModel(req.params.modelId, req.user.id);

    const views = await ViewerState.find({
      modelId: req.params.modelId,
      userId: req.user.id,
    })
      .sort({ createdAt: 1 })
      .lean();

    return res.json({
      success: true,
      data: {
        views: views.map((v) => ({
          id: v._id.toString(),
          modelId: v.modelId.toString(),
          name: v.name,
          camera: v.camera,
          target: v.target,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        })),
      },
    });
  } catch (err) {
    return next(err);
  }
}

/** POST /api/models/:modelId/views */
async function createView(req, res, next) {
  try {
    await assertOwnedModel(req.params.modelId, req.user.id);

    const { name, camera, target } = req.body;

    const view = await ViewerState.create({
      userId: req.user.id,
      modelId: req.params.modelId,
      name: name.trim(),
      camera,
      target,
    });

    return res.status(201).json({
      success: true,
      message: 'View saved',
      data: { view: view.toPublicJSON() },
    });
  } catch (err) {
    return next(err);
  }
}

/** PUT /api/models/:modelId/views/:viewId */
async function updateView(req, res, next) {
  try {
    const { name, camera, target } = req.body;

    const update = {};
    if (name) update.name = name.trim();
    if (camera) update.camera = camera;
    if (target) update.target = target;

    const view = await ViewerState.findOneAndUpdate(
      { _id: req.params.viewId, modelId: req.params.modelId, userId: req.user.id },
      update,
      { new: true, runValidators: true }
    );

    if (!view) {
      const err = new Error('Saved view not found');
      err.statusCode = 404;
      throw err;
    }

    return res.json({
      success: true,
      message: 'View updated',
      data: { view: view.toPublicJSON() },
    });
  } catch (err) {
    return next(err);
  }
}

/** DELETE /api/models/:modelId/views/:viewId */
async function deleteView(req, res, next) {
  try {
    const result = await ViewerState.findOneAndDelete({
      _id: req.params.viewId,
      modelId: req.params.modelId,
      userId: req.user.id,
    });

    if (!result) {
      const err = new Error('Saved view not found');
      err.statusCode = 404;
      throw err;
    }

    return res.json({ success: true, message: 'View deleted' });
  } catch (err) {
    return next(err);
  }
}

module.exports = { listViews, createView, updateView, deleteView };
