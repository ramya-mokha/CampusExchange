const { User, Product } = require('../models');

// @desc    Get dashboard statistics for Admin
// @route   GET /api/admin/stats
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const activeProducts = await Product.countDocuments({ status: 'active' });
    const soldProducts = await Product.countDocuments({ status: 'sold' });

    // Category distribution
    let products;
    const isMock = require('../config/db').isUsingMock();
    if (isMock) {
      const queryRes = await Product.find({});
      products = queryRes.results || queryRes;
    } else {
      products = await Product.find({});
    }

    const categoryStats = {};
    const defaultCategories = [
      '📚 Books', 
      '💻 Electronics', 
      '🪑 Furniture', 
      '🚲 Cycles', 
      '👕 Clothing', 
      '🎒 Hostel Essentials', 
      '🔌 Accessories', 
      'Others'
    ];
    
    // Initialize defaults
    defaultCategories.forEach(cat => {
      categoryStats[cat] = 0;
    });

    products.forEach(prod => {
      const cat = prod.category || 'Others';
      categoryStats[cat] = (categoryStats[cat] || 0) + 1;
    });

    // Formatting category stats for easy representation in frontend charts
    const categoryData = Object.keys(categoryStats).map(name => ({
      name,
      count: categoryStats[name]
    })).sort((a, b) => b.count - a.count);

    // Recent items
    let recentProducts;
    if (isMock) {
      const queryRes = await Product.find({}).populate('seller').sort({ createdAt: -1 });
      recentProducts = (queryRes.results || queryRes).slice(0, 5);
    } else {
      recentProducts = await Product.find({})
        .populate('seller', 'name email')
        .sort({ createdAt: -1 })
        .limit(5);
    }

    res.json({
      summary: {
        totalUsers,
        totalProducts,
        activeProducts,
        soldProducts
      },
      categoryDistribution: categoryData,
      recentProducts
    });
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    res.status(500).json({ message: 'Server error fetching statistics' });
  }
};

// @desc    Get list of all users
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    let users;
    const isMock = require('../config/db').isUsingMock();
    if (isMock) {
      const queryRes = await User.find({});
      users = queryRes.results || queryRes;
    } else {
      users = await User.find({}).select('-password').sort({ createdAt: -1 });
    }

    // Format safe users
    const safeUsers = users.map(u => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      isVitVerified: u.email.endsWith('@vitstudent.ac.in') || u.email.endsWith('@vit.ac.in')
    }));

    res.json(safeUsers);
  } catch (error) {
    console.error('Fetch admin users error:', error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const rawUser = user.exec ? user.exec() : user;
    if (rawUser.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin account' });
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    // Delete all products by this user
    const isMock = require('../config/db').isUsingMock();
    if (isMock) {
      const ProductModel = require('./mockDb').Product;
      const products = await ProductModel.find({ seller: req.params.id });
      for (const p of products.results) {
        await ProductModel.findByIdAndDelete(p._id);
      }
    } else {
      await require('./Product').deleteMany({ seller: req.params.id });
    }

    res.json({ message: 'User and all their listings deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  deleteUser
};
