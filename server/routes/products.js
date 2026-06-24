const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../dbHelper');
const { requireAdmin, authenticateToken } = require('../middleware/auth');

// GET all products with filtering, search, sorting, ratings, and stock filters
router.get('/', (req, res) => {
  let products = readData('products.json');
  const { search, category, minPrice, maxPrice, sort, minRating, hideOutOfStock } = req.query;

  // Search filtering
  if (search) {
    const query = search.toLowerCase();
    products = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query)
    );
  }

  // Category filtering
  if (category && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  // Price range filtering
  if (minPrice) {
    products = products.filter(p => p.price >= parseFloat(minPrice));
  }
  if (maxPrice) {
    products = products.filter(p => p.price <= parseFloat(maxPrice));
  }

  // Minimum Rating filtering (e.g. 4 stars and above)
  if (minRating) {
    products = products.filter(p => p.rating >= parseFloat(minRating));
  }

  // Hide Out of Stock
  if (hideOutOfStock === 'true') {
    products = products.filter(p => p.stock > 0);
  }

  // Sorting
  if (sort) {
    if (sort === 'price-asc') {
      products.sort((a, b) => {
        const pA = a.flashSale && a.flashSalePrice ? a.flashSalePrice : a.price;
        const pB = b.flashSale && b.flashSalePrice ? b.flashSalePrice : b.price;
        return pA - pB;
      });
    } else if (sort === 'price-desc') {
      products.sort((a, b) => {
        const pA = a.flashSale && a.flashSalePrice ? a.flashSalePrice : a.price;
        const pB = b.flashSale && b.flashSalePrice ? b.flashSalePrice : b.price;
        return pB - pA;
      });
    } else if (sort === 'rating') {
      products.sort((a, b) => b.rating - a.rating);
    } else if (sort === 'popular') {
      products.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));
    }
  }

  return res.json(products);
});

// GET single product details
router.get('/:id', (req, res) => {
  const products = readData('products.json');
  const product = products.find(p => p.id === req.params.id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  return res.json(product);
});

// POST a new product (Admin Only)
router.post('/', requireAdmin, (req, res) => {
  const { name, description, price, category, stock, image, images, specs, variants, isFeatured, flashSale, flashSalePrice } = req.body;

  if (!name || !description || !price || !category || stock === undefined || !image) {
    return res.status(400).json({ success: false, message: 'Missing required product information.' });
  }

  const products = readData('products.json');

  // Process variants if passed as comma-separated string
  let processedVariants = [];
  if (variants) {
    if (Array.isArray(variants)) {
      processedVariants = variants;
    } else if (typeof variants === 'string') {
      processedVariants = variants.split(',').map(v => v.trim()).filter(v => v.length > 0);
    }
  }

  const newProduct = {
    id: 'p_' + Date.now(),
    name,
    description,
    price: parseFloat(price),
    category,
    stock: parseInt(stock),
    image,
    images: images || [image],
    specs: specs || {},
    variants: processedVariants,
    rating: 5.0,
    reviews: [],
    isFeatured: isFeatured || false,
    flashSale: flashSale || false,
    flashSalePrice: flashSalePrice ? parseFloat(flashSalePrice) : null
  };

  products.push(newProduct);
  writeData('products.json', products);

  return res.status(201).json({ success: true, message: 'Product added successfully!', product: newProduct });
});

// PUT (Edit) an existing product (Admin Only)
router.put('/:id', requireAdmin, (req, res) => {
  const { name, description, price, category, stock, image, images, specs, variants, isFeatured, flashSale, flashSalePrice } = req.body;
  const products = readData('products.json');
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  // Process variants if passed as comma-separated string or array
  let processedVariants = products[index].variants;
  if (variants !== undefined) {
    if (Array.isArray(variants)) {
      processedVariants = variants;
    } else if (typeof variants === 'string') {
      processedVariants = variants.split(',').map(v => v.trim()).filter(v => v.length > 0);
    }
  }

  const updatedProduct = {
    ...products[index],
    name: name !== undefined ? name : products[index].name,
    description: description !== undefined ? description : products[index].description,
    price: price !== undefined ? parseFloat(price) : products[index].price,
    category: category !== undefined ? category : products[index].category,
    stock: stock !== undefined ? parseInt(stock) : products[index].stock,
    image: image !== undefined ? image : products[index].image,
    images: images !== undefined ? images : products[index].images,
    specs: specs !== undefined ? specs : products[index].specs,
    variants: processedVariants,
    isFeatured: isFeatured !== undefined ? isFeatured : products[index].isFeatured,
    flashSale: flashSale !== undefined ? flashSale : products[index].flashSale,
    flashSalePrice: flashSalePrice !== undefined ? (flashSalePrice ? parseFloat(flashSalePrice) : null) : products[index].flashSalePrice
  };

  products[index] = updatedProduct;
  writeData('products.json', products);

  return res.json({ success: true, message: 'Product updated successfully!', product: updatedProduct });
});

// DELETE a product (Admin Only)
router.delete('/:id', requireAdmin, (req, res) => {
  const products = readData('products.json');
  const filteredProducts = products.filter(p => p.id !== req.params.id);

  if (products.length === filteredProducts.length) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  writeData('products.json', filteredProducts);
  return res.json({ success: true, message: 'Product deleted successfully!' });
});

// POST review for a product (Authenticated Users Only)
router.post('/:id/reviews', authenticateToken, (req, res) => {
  const { rating, comment } = req.body;
  const reviewer = req.user.name;

  if (rating === undefined || !comment) {
    return res.status(400).json({ success: false, message: 'Rating and comment are required.' });
  }

  const products = readData('products.json');
  const index = products.findIndex(p => p.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const newReview = {
    reviewer,
    rating: parseFloat(rating),
    comment,
    date: new Date().toISOString()
  };

  const product = products[index];
  product.reviews = product.reviews || [];
  product.reviews.push(newReview);

  // Recalculate average rating
  const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
  product.rating = parseFloat((totalRating / product.reviews.length).toFixed(1));

  products[index] = product;
  writeData('products.json', products);

  return res.status(201).json({ success: true, message: 'Review added successfully!', product });
});

module.exports = router;
