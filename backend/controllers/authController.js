const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'super_secret_campus_exchange_key_12345', 
    { expiresIn: '30d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check if it is a VIT Student email (Optional validation)
    const isVitEmail = email.toLowerCase().endsWith('@vitstudent.ac.in') || email.toLowerCase().endsWith('@vit.ac.in');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user (Note: in mock mode or Mongo mode User.create works)
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash: hashedPassword,
      role: 'student', // Default role is student
      wishlist: []
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVitVerified: isVitEmail,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash || user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isVitEmail = user.email.endsWith('@vitstudent.ac.in') || user.email.endsWith('@vit.ac.in');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVitVerified: isVitEmail,
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// @desc    Get user profile data
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isVitEmail = user.email.endsWith('@vitstudent.ac.in') || user.email.endsWith('@vit.ac.in');

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVitVerified: isVitEmail,
      wishlist: user.wishlist
    });
  } catch (error) {
    console.error('Fetch me error:', error);
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

module.exports = {
  register,
  login,
  getMe
};
