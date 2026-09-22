const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  getMyProducts,
  createProduct, 
  updateProduct, 
  deleteProduct, 
  toggleWishlist 
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', getProducts);
router.get('/user/me', protect, getMyProducts);
router.get('/:id', getProductById);

router.post('/', protect, upload.array('images', 5), createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);
router.post('/:id/wishlist', protect, toggleWishlist);

module.exports = router;
