const { body, validationResult } = require('express-validator');

/**
 * Runs all accumulated express-validator errors and
 * returns a 422 response if any exist.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ── Register ─────────────────────────────────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('rollNumber')
    .trim()
    .notEmpty().withMessage('Roll number is required'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required'),

  body('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 1, max: 4 }).withMessage('Year must be between 1 and 4'),

  validate,
];

// ── Login ─────────────────────────────────────────────────────────────────────
const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required'),

  validate,
];

module.exports = { registerRules, loginRules };
