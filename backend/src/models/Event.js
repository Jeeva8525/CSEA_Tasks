const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Event description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['technical', 'non-technical', 'workshop', 'hackathon', 'other'],
        message: 'Category must be one of: technical, non-technical, workshop, hackathon, other',
      },
      default: 'other',
    },
    symposium: {
      type: String,
      enum: {
        values: ['SYNC', 'ABACUS', 'standalone'],
        message: 'Symposium must be one of: SYNC, ABACUS, standalone',
      },
      default: 'standalone',
    },
    venue: {
      type: String,
      required: [true, 'Venue is required'],
      trim: true,
    },
    eventDate: {
      type: Date,
      required: [true, 'Event date is required'],
    },
    registrationDeadline: {
      type: Date,
      required: [true, 'Registration deadline is required'],
    },
    maxParticipants: {
      type: Number,
      required: [true, 'Maximum participants count is required'],
      min: [1, 'Must allow at least 1 participant'],
    },
    entryFee: {
      type: Number,
      default: 0,
      min: [0, 'Entry fee cannot be negative'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    // Virtual: registrationCount — populated on-demand in controllers
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Indexes ─────────────────────────────────────────────────────────────────
// Speed up common list queries
eventSchema.index({ eventDate: 1 });
eventSchema.index({ symposium: 1 });
eventSchema.index({ isActive: 1, eventDate: 1 }); // compound for active event listing

// ── Virtual: reverse-populate registrations ──────────────────────────────────
// DS/Algorithm: Virtual populate — O(n) join without storing participant arrays
// on the Event document, keeping documents lean.
eventSchema.virtual('registrations', {
  ref: 'Registration',
  localField: '_id',
  foreignField: 'event',
  justOne: false,
});

// ── Validation: deadline must be before event date ───────────────────────────
eventSchema.pre('save', function (next) {
  if (this.registrationDeadline >= this.eventDate) {
    return next(new Error('Registration deadline must be before event date'));
  }
  next();
});

module.exports = mongoose.model('Event', eventSchema);
