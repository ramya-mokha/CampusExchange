const { Message, User } = require('../models');

// Helper to construct a standard chatId from two user IDs
const makeChatId = (user1, user2) => {
  return [user1.toString(), user2.toString()].sort().join('_');
};

// @desc    Get user's active conversations (list of chat threads)
// @route   GET /api/chats
// @access  Private
const getChats = async (req, res) => {
  try {
    const userId = req.user.id.toString();

    // Query messages involving the user
    let messages;
    const isMock = require('../config/db').isUsingMock();
    if (isMock) {
      const queryRes = await Message.find({});
      messages = queryRes.results || queryRes;
    } else {
      messages = await Message.find({
        $or: [{ sender: userId }, { recipient: userId }]
      });
    }

    // Filter messages involving the current user (if mock, mongoose does it directly)
    const userMessages = isMock 
      ? messages.filter(m => m.sender.toString() === userId || m.recipient.toString() === userId)
      : messages;

    // Group by chatId
    const threads = {};
    for (const msg of userMessages) {
      const cId = msg.chatId;
      if (!threads[cId] || new Date(msg.timestamp) > new Date(threads[cId].timestamp)) {
        threads[cId] = msg;
      }
    }

    // Convert to list and populate other participant details
    const conversations = [];
    for (const cId in threads) {
      const lastMsg = threads[cId];
      const otherUserId = lastMsg.sender.toString() === userId 
        ? lastMsg.recipient.toString() 
        : lastMsg.sender.toString();

      const otherUser = await User.findById(otherUserId);
      const rawUser = otherUser && (otherUser.exec ? otherUser.exec() : otherUser);
      
      if (rawUser) {
        conversations.push({
          chatId: cId,
          lastMessage: {
            text: lastMsg.text,
            timestamp: lastMsg.timestamp,
            sender: lastMsg.sender
          },
          otherUser: {
            _id: rawUser._id,
            name: rawUser.name,
            email: rawUser.email,
            role: rawUser.role,
            isVitVerified: rawUser.email.endsWith('@vitstudent.ac.in') || rawUser.email.endsWith('@vit.ac.in')
          }
        });
      }
    }

    // Sort conversations by last message timestamp descending
    conversations.sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));

    res.json(conversations);
  } catch (error) {
    console.error('Fetch chats error:', error);
    res.status(500).json({ message: 'Server error fetching chats' });
  }
};

// @desc    Get message history for a specific room
// @route   GET /api/chats/:otherUserId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { otherUserId } = req.params;

    const chatId = makeChatId(userId, otherUserId);

    let messages;
    const isMock = require('../config/db').isUsingMock();
    if (isMock) {
      const queryRes = await Message.find({ chatId });
      messages = queryRes.results || queryRes;
    } else {
      messages = await Message.find({ chatId })
        .populate('sender', 'name email role')
        .populate('recipient', 'name email role')
        .sort({ timestamp: 1 });
    }

    // Double check sort for mock messages
    if (isMock) {
      messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    res.json(messages);
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ message: 'Server error fetching messages' });
  }
};

module.exports = {
  getChats,
  getMessages,
  makeChatId
};
