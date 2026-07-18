const express = require('express');
const { registerForEvent, getParticipants } = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');

// mergeParams: true allows access to :id from parent eventRoutes
const router = express.Router({ mergeParams: true });

router.post('/', protect, authorize('student', 'admin'), registerForEvent);
router.get('/', protect, authorize('admin'), getParticipants);

module.exports = router;
