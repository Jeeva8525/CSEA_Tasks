const { body, validationResult } = require('express-validator');

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

// ── Shared field rules (reused for create & update) ──────────────────────────
const eventFieldRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3–100 characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn(['technical', 'non-technical', 'workshop', 'hackathon', 'other'])
    .withMessage('Invalid category'),

  body('symposium')
    .optional()
    .isIn(['SYNC', 'ABACUS', 'standalone'])
    .withMessage('Symposium must be SYNC, ABACUS, or standalone'),

  body('venue')
    .trim()
    .notEmpty().withMessage('Venue is required'),

  body('eventDate')
    .notEmpty().withMessage('Event date is required')
    .isISO8601().withMessage('Event date must be a valid ISO date')
    .toDate(),

  body('registrationDeadline')
    .notEmpty().withMessage('Registration deadline is required')
    .isISO8601().withMessage('Registration deadline must be a valid ISO date')
    .toDate()
    .custom((deadline, { req }) => {
      if (req.body.eventDate && deadline >= new Date(req.body.eventDate)) {
        throw new Error('Registration deadline must be before event date');
      }
      return true;
    }),

  body('maxParticipants')
    .notEmpty().withMessage('Max participants is required')
    .isInt({ min: 1 }).withMessage('Max participants must be at least 1'),

  body('entryFee')
    .optional()
    .isFloat({ min: 0 }).withMessage('Entry fee cannot be negative'),

  body('tags')
    .optional()
    .isArray().withMessage('Tags must be an array'),
];

// Create: all required fields must be present
const createEventRules = [...eventFieldRules, validate];

// Update: same rules but every field is optional (PATCH semantics)
const updateEventRules = [
  ...eventFieldRules.map((rule) => rule.optional()),
  validate,
];

module.exports = { createEventRules, updateEventRules };
