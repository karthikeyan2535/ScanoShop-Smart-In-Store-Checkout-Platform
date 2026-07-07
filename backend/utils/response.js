/**
 * Standard API response helpers
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * @param {object} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code
 * @param {Array|null} errors - Field-level validation errors [{field, message}]
 */
const sendError = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const response = { success: false, message };
  if (errors && errors.length > 0) {
    // Normalise express-validator error format → [{field, message}]
    response.errors = errors.map((e) => ({
      field: e.path || e.param || e.field || 'general',
      message: e.msg || e.message || e,
    }));
  }
  return res.status(statusCode).json(response);
};

const sendCreated = (res, data, message = 'Created successfully') => {
  return sendSuccess(res, data, message, 201);
};

module.exports = { sendSuccess, sendError, sendCreated };
