const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Event',
      required: [true, 'Event reference is required'],
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student reference is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'cancelled'],
        message: 'Status must be confirmed or cancelled',
      },
      default: 'confirmed',
    },
    registeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: false } // registeredAt serves as the timestamp
);

// ── Compound Unique Index ────────────────────────────────────────────────────
// DS/Algorithm: B-tree compound index — O(log n) lookup.
// Enforces at DB level: a student can register for each event only once.
registrationSchema.index({ event: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);
