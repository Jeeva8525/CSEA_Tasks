const Event = require('../models/Event');
const Registration = require('../models/Registration');

// ── POST /api/events/:id/registrations ──────────────────────────────────────
const registerForEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event || !event.isActive) {
      return res.status(404).json({ success: false, message: 'Event not found or inactive.' });
    }

    // Check registration deadline
    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Registration deadline has passed.',
      });
    }

    // Check capacity — count only confirmed registrations
    const confirmedCount = await Registration.countDocuments({
      event: event._id,
      status: 'confirmed',
    });

    if (confirmedCount >= event.maxParticipants) {
      return res.status(409).json({ success: false, message: 'Event is fully booked.' });
    }

    // DS: Compound unique index on {event, student} prevents duplicate at DB level.
    // The catch block for code 11000 in errorHandler handles the race-condition edge case.
    const registration = await Registration.create({
      event: event._id,
      student: req.user._id,
    });

    res.status(201).json({ success: true, message: 'Registered successfully.', data: registration });
  } catch (error) {
    // Duplicate key from compound index → handled by central errorHandler (409)
    next(error);
  }
};

// ── GET /api/events/:id/registrations  [Admin only] ─────────────────────────
const getParticipants = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Virtual populate: reverse-join without storing participant arrays on Event
    const registrations = await Registration.find({
      event: req.params.id,
      status: 'confirmed',
    })
      .populate('student', 'name email rollNumber department year')
      .sort({ registeredAt: 1 })
      .lean();

    res.status(200).json({
      success: true,
      event: event.title,
      totalParticipants: registrations.length,
      data: registrations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { registerForEvent, getParticipants };
