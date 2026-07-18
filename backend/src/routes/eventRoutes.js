const express = require('express');
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');
const { createEventRules, updateEventRules } = require('../validators/eventValidator');
const registrationRoutes = require('./registrationRoutes');

const router = express.Router();

// Forward /:id/registrations sub-resource to registrationRoutes
router.use('/:id/registrations', registrationRoutes);

// Public
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Admin only
router.post('/', protect, authorize('admin'), createEventRules, createEvent);
router.put('/:id', protect, authorize('admin'), updateEventRules, updateEvent);
router.delete('/:id', protect, authorize('admin'), deleteEvent);

module.exports = router;
