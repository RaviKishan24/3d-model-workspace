const express = require('express');
const { body, param, query } = require('express-validator');
const {
  listModels,
  getModel,
  createModel,
  deleteModel,
} = require('../controllers/modelController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const viewerRoutes = require('./viewerRoutes');

const router = express.Router();

router.use(protect);

// Nested saved-view routes: /api/models/:modelId/views
router.use('/:modelId/views', viewerRoutes);

router.get(
  '/',
  [query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 50 })],
  validate,
  listModels
);

router.get('/:id', [param('id').isMongoId()], validate, getModel);

router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1, max: 120 }).withMessage('Model name is required'),
    body('fileName').trim().notEmpty().withMessage('File name is required'),
    // CHANGED: s3Key → storagePath
    body('storagePath').trim().notEmpty().withMessage('storagePath is required'),
  ],
  validate,
  createModel
);

router.delete('/:id', [param('id').isMongoId()], validate, deleteModel);

module.exports = router;