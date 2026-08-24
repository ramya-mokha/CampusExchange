const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chatId: {
    type: String, // Constructed as "userAId_userBId" where userAId < userBId alphabetically
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Message || mongoose.model('Message', messageSchema);
