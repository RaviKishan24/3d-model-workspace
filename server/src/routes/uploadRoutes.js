const express = require('express');
const { body } = require('express-validator');
const { createPresignedUrl } = require('../controllers/uploadController');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validationMiddleware');
const { uploadLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

router.post(
  '/presigned-url',
  protect,
  uploadLimiter,
  [
    body('fileName').trim().notEmpty().withMessage('File name is required'),
    body('fileSize').isInt({ min: 1 }).withMessage('File size is required'),
    body('contentType').optional().isString(),
  ],
  validate,
  createPresignedUrl
);

module.exports = router;
