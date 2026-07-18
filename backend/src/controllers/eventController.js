const Event = require('../models/Event');
const Registration = require('../models/Registration');

// ── GET /api/events ──────────────────────────────────────────────────────────
// Query params: symposium, category, page, limit
const getAllEvents = async (req, res, next) => {
  try {
    const { symposium, category, page = 1, limit = 10 } = req.query;

    // Build filter object — only active events for public listing
    const filter = { isActive: true };
    if (symposium) filter.symposium = symposium;
    if (category) filter.category = category;

    const skip = (Number(page) - 1) * Number(limit);

    // DS: Index on { isActive:1, eventDate:1 } makes this O(log n + k)
    const [events, total] = await Promise.all([
      Event.find(filter)
        .populate('createdBy', 'name email')
        .sort({ eventDate: 1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Event.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/events/:id ──────────────────────────────────────────────────────
const getEventById = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email')
      .lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    // Include registration count
    const registrationCount = await Registration.countDocuments({
      event: req.params.id,
      status: 'confirmed',
    });

    res.status(200).json({ success: true, data: { ...event, registrationCount } });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/events  [Admin only] ───────────────────────────────────────────
const createEvent = async (req, res, next) => {
  try {
    const event = await Event.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/events/:id  [Admin only] ────────────────────────────────────────
const updateEvent = async (req, res, next) => {
  try {
    // Disallow createdBy override
    delete req.body.createdBy;

    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    res.status(200).json({ success: true, data: event });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/events/:id  [Admin only] — soft delete ───────────────────────
const deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found.' });
    }

    res.status(200).json({ success: true, message: 'Event deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent };
