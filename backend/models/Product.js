const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: [
      '📚 Books', 
      '💻 Electronics', 
      '🪑 Furniture', 
      '🚲 Cycles', 
      '👕 Clothing', 
      '🎒 Hostel Essentials', 
      '🔌 Accessories', 
      'Others'
    ]
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  condition: {
    type: String,
    required: true,
    enum: ['New', 'Like New', 'Good', 'Fair']
  },
  images: [{
    type: String // Cloudinary URLs or Local file URLs
  }],
  pickupLocation: {
    type: String,
    required: true,
    enum: ['Library', 'AB1', 'AB2', 'Hostel Gate', 'Food Court', 'Academic Block']
  },
  seller: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'sold'],
    default: 'active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Product || mongoose.model('Product', productSchema);
