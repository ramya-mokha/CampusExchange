const express = require('express');
const router = express.Router();
const { getChats, getMessages } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getChats);
router.get('/:otherUserId', protect, getMessages);

module.exports = router;
