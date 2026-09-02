const { Product, User } = require('../models');
const { uploadToCloud } = require('../middleware/upload');

// @desc    Get all products (with search & filters)
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      condition, 
      pickupLocation,
      minPrice, 
      maxPrice, 
      seller,
      status // default to active if not provided, or 'all' to return everything
    } = req.query;

    let filter = {};

    // Filter by active status by default, unless searching for a specific seller's history
    if (status && status !== 'all') {
      filter.status = status;
    } else if (!status) {
      filter.status = 'active';
    }

    // Filter by seller ID
    if (seller) {
      filter.seller = seller;
    }

    // Text Search (Name, Title, Description, and Category)
    if (search && search.trim()) {
      const trimmedSearch = search.trim();
      const regex = { $regex: trimmedSearch, $options: 'i' };
      filter.$or = [
        { name: regex },
        { title: regex },
        { description: regex },
        { category: regex }
      ];
    }

    // Category Filter
    if (category && category !== 'All') {
      filter.category = category;
    }

    // Condition Filter
    if (condition) {
      filter.condition = condition;
    }

    // Pickup Location Filter
    if (pickupLocation && pickupLocation !== 'All Locations') {
      filter.pickupLocation = pickupLocation;
    }

    // Price Filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Support OR queries in Mock DB if needed
    const isMock = require('../config/db').isUsingMock();
    let products;
    if (isMock) {
      if (filter.$or) {
        const searchVal = search.trim().toLowerCase();
        delete filter.$or;
        const tempProducts = await Product.find(filter).populate('seller');
        const list = Array.isArray(tempProducts) ? tempProducts : tempProducts.results || [];
        products = list.filter(p => 
          (p.name && p.name.toLowerCase().includes(searchVal)) || 
          (p.title && p.title.toLowerCase().includes(searchVal)) ||
          (p.description && p.description.toLowerCase().includes(searchVal)) ||
          (p.category && p.category.toLowerCase().includes(searchVal))
        );
        products.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      } else {
        const queryRes = await Product.find(filter).populate('seller').sort({ createdAt: -1 });
        products = Array.isArray(queryRes) ? queryRes : queryRes.results || [];
      }
    } else {
      // Mongo Query
      products = await Product.find(filter)
        .populate('seller', '-password')
        .sort({ createdAt: -1 });
    }

    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Server error fetching products' });
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', '-password');
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // In Mock, populate returns wrapper
    const result = product.exec ? product.exec() : product;
    res.json(result);
  } catch (error) {
    console.error('Fetch product detail error:', error);
    res.status(500).json({ message: 'Server error fetching product details' });
  }
};

// @desc    Create a product listing
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const { name, description, category, price, condition, pickupLocation } = req.body;

    if (!name || !description || !category || !price || !condition || !pickupLocation) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Process files
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const url = await uploadToCloud(file, req);
        if (url) imageUrls.push(url);
      }
    } else if (req.file) {
      const url = await uploadToCloud(req.file, req);
      if (url) imageUrls.push(url);
    }

    // Fallback image if none uploaded
    if (imageUrls.length === 0) {
      imageUrls.push('https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=400');
    }

    const product = await Product.create({
      name,
      description,
      category,
      price: Number(price),
      condition,
      pickupLocation,
      images: imageUrls,
      seller: req.user.id,
      status: 'active'
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Server error creating product listing' });
  }
};

// @desc    Update a product listing
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Mongoose vs Mock object extraction
    const rawProd = product.exec ? product.exec() : product;

    // Check ownership (only seller or admin can modify)
    const sellerId = rawProd.seller._id ? rawProd.seller._id.toString() : rawProd.seller.toString();
    if (sellerId !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this listing' });
    }

    const { name, description, category, price, condition, pickupLocation, status } = req.body;

    const updatedData = {};
    if (name) updatedData.name = name;
    if (description) updatedData.description = description;
    if (category) updatedData.category = category;
    if (price) updatedData.price = Number(price);
    if (condition) updatedData.condition = condition;
    if (pickupLocation) updatedData.pickupLocation = pickupLocation;
    if (status) updatedData.status = status;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Server error updating product' });
  }
};

// @desc    Delete a product listing
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const rawProd = product.exec ? product.exec() : product;

    // Check ownership
    const sellerId = rawProd.seller._id ? rawProd.seller._id.toString() : rawProd.seller.toString();
    if (sellerId !== req.user.id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing' });
    }

    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Listing removed successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Server error deleting listing' });
  }
};

// @desc    Toggle item in wishlist
// @route   POST /api/products/:id/wishlist
// @access  Private
const toggleWishlist = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const user = await User.findById(req.user.id);
    const rawUser = user.exec ? user.exec() : user;

    // Wishlist check
    const wishlistIds = rawUser.wishlist.map(id => id.toString());
    const isWishlisted = wishlistIds.includes(productId.toString());

    let updatedUser;
    if (isWishlisted) {
      // Remove from wishlist
      updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $pull: { wishlist: productId } },
        { new: true }
      );
      res.json({ isWishlisted: false, message: 'Removed from wishlist', wishlist: updatedUser.wishlist });
    } else {
      // Add to wishlist
      updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        { $addToSet: { wishlist: productId } },
        { new: true }
      );
      res.json({ isWishlisted: true, message: 'Added to wishlist', wishlist: updatedUser.wishlist });
    }
  } catch (error) {
    console.error('Wishlist toggle error:', error);
    res.status(500).json({ message: 'Server error toggling wishlist' });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleWishlist
};
