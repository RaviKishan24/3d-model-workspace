const supabaseService = require('../services/supabaseService');

/**
 * POST /api/uploads/presigned-url
 * Returns a short-lived Supabase signed upload URL plus the storage path the client
 * must send back when it registers the model. No bytes flow through this server.
 */
async function createPresignedUrl(req, res, next) {
  try {
    const { fileName, contentType, fileSize } = req.body;

    // Validate file type, size, and extension
    const validated = supabaseService.validateUpload({ fileName, contentType, fileSize });
    // Build a unique storage path: e.g., models/{userId}/{timestamp}.glb
    const key = supabaseService.buildObjectKey(req.user.id, validated.ext);

    // Generate a signed upload URL (valid for 5 minutes)
    const { url, expiresIn } = await supabaseService.createPresignedUploadUrl({
      key,
      contentType: validated.contentType,
      fileSize: validated.fileSize,
    });

    // Return the URL and metadata to the client
    return res.status(201).json({
      success: true,
      data: {
        uploadUrl: url,
        method: 'PUT',
        expiresIn,
        storagePath: key,            // renamed from s3Key
        contentType: validated.contentType,
        fileType: validated.ext,
        fileSize: validated.fileSize, // so client can send it back in /api/models
      },
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createPresignedUrl };