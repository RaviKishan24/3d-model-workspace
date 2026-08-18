const { validationResult } = require('express-validator');

/** Collects express-validator errors into a single 400 response. */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const err = new Error('Validation failed');
  err.statusCode = 400;
  err.details = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(err);
}

module.exports = { validate };
