const express = require('express');
const { body, param } = require('express-validator');
const {
  listViews,
  createView,
  updateView,
  deleteView,
} = require('../controllers/viewerController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');

// mergeParams: this router is mounted under /api/models/:modelId/views
const router = express.Router({ mergeParams: true });

const vector = (field) => [
  body(`${field}.x`).isFloat().withMessage(`${field}.x must be a number`),
  body(`${field}.y`).isFloat().withMessage(`${field}.y must be a number`),
  body(`${field}.z`).isFloat().withMessage(`${field}.z must be a number`),
];

router.use(protect);

router.get('/', [param('modelId').isMongoId()], validate, listViews);

router.post(
  '/',
  [
    param('modelId').isMongoId(),
    body('name').trim().isLength({ min: 1, max: 60 }).withMessage('View name is required'),
    ...vector('camera.position'),
    ...vector('camera.rotation'),
    body('camera.zoom').optional().isFloat({ min: 0.0001 }),
    ...vector('target'),
  ],
  validate,
  createView
);

router.put(
  '/:viewId',
  [
    param('modelId').isMongoId(),
    param('viewId').isMongoId(),
    body('name').optional().trim().isLength({ min: 1, max: 60 }),
  ],
  validate,
  updateView
);

router.delete(
  '/:viewId',
  [param('modelId').isMongoId(), param('viewId').isMongoId()],
  validate,
  deleteView
);

module.exports = router;
