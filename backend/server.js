const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../public')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/inventory-genie';
mongoose.connect(MONGODB_URI)
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Base Product Schema (master product catalog)
const baseProductSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: 'general'
  },
  description: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Product Batch Schema (individual batches with SKU)
const productBatchSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sku: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  baseProductId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BaseProduct',
    required: true
  },
  baseProductName: {
    type: String,
    required: true,
    trim: true
  },
  batchNumber: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  expiryDate: {
    type: Date
  },
  manufacturingDate: {
    type: Date
  },
  supplier: {
    type: String,
    trim: true
  },
  location: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Keep original schema for backward compatibility (will be deprecated)
const productSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    default: 'general'
  },
  expiryDate: {
    type: Date
  },
  dateAdded: {
    type: Date,
    default: Date.now
  }
});

// Sales Schema (user-specific)
const salesSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  total: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);
const BaseProduct = mongoose.model('BaseProduct', baseProductSchema);
const ProductBatch = mongoose.model('ProductBatch', productBatchSchema);
const Product = mongoose.model('Product', productSchema); // Keep for backward compatibility
const Sales = mongoose.model('Sales', salesSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth Routes
app.post('/api/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign({ 
      userId: user._id, 
      username: user.username 
    }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ 
      userId: user._id, 
      username: user.username 
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Product Batch Routes (New SKU System)
app.get('/api/products', authenticateToken, async (req, res) => {
  try {
    const productBatches = await ProductBatch.find({ userId: req.user.userId })
      .populate('baseProductId')
      .sort({ expiryDate: 1 });
    res.json(productBatches);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Server error fetching products' });
  }
});

app.post('/api/products', authenticateToken, async (req, res) => {
  try {
    const { name, category, description, brand, batchNumber, quantity, price, expiryDate, manufacturingDate, supplier, location } = req.body;
    
    // Find or create base product
    let baseProduct = await BaseProduct.findOne({ 
      userId: req.user.userId,
      name: name.trim(),
      brand: brand?.trim() || ''
    });
    
    if (!baseProduct) {
      baseProduct = new BaseProduct({
        userId: req.user.userId,
        name: name.trim(),
        category: category || 'general',
        description: description?.trim() || '',
        brand: brand?.trim() || ''
      });
      await baseProduct.save();
    }
    
    // Generate unique SKU
    const timestamp = Date.now().toString().slice(-6);
    const productPrefix = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
    const batchSuffix = batchNumber ? batchNumber.substring(0, 6).toUpperCase() : timestamp;
    const sku = `${productPrefix}-${batchSuffix}`;
    
    // Ensure SKU is unique by appending random characters if needed
    let finalSku = sku;
    let counter = 1;
    while (await ProductBatch.findOne({ sku: finalSku })) {
      finalSku = `${sku}-${counter}`;
      counter++;
    }
    
    const productBatch = new ProductBatch({
      userId: req.user.userId,
      sku: finalSku,
      baseProductId: baseProduct._id,
      baseProductName: name.trim(),
      batchNumber: batchNumber?.trim() || '',
      quantity,
      price,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      manufacturingDate: manufacturingDate ? new Date(manufacturingDate) : null,
      supplier: supplier?.trim() || '',
      location: location?.trim() || ''
    });
    
    await productBatch.save();
    const populatedBatch = await ProductBatch.findById(productBatch._id).populate('baseProductId');
    res.status(201).json(populatedBatch);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Server error creating product' });
  }
});

app.put('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const { quantity, price, expiryDate, manufacturingDate, supplier, location, batchNumber } = req.body;
    
    // Update only batch-specific fields
    const updateData = {
      updatedAt: new Date()
    };
    
    if (quantity !== undefined) updateData.quantity = quantity;
    if (price !== undefined) updateData.price = price;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (manufacturingDate !== undefined) updateData.manufacturingDate = manufacturingDate ? new Date(manufacturingDate) : null;
    if (supplier !== undefined) updateData.supplier = supplier?.trim() || '';
    if (location !== undefined) updateData.location = location?.trim() || '';
    if (batchNumber !== undefined) updateData.batchNumber = batchNumber?.trim() || '';
    
    const productBatch = await ProductBatch.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      updateData,
      { new: true }
    ).populate('baseProductId');
    
    if (!productBatch) {
      return res.status(404).json({ error: 'Product batch not found' });
    }
    
    res.json(productBatch);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Server error updating product' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  try {
    const productBatch = await ProductBatch.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!productBatch) {
      return res.status(404).json({ error: 'Product batch not found' });
    }
    
    res.json({ message: 'Product batch deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Server error deleting product' });
  }
});

// Get products grouped by base product
app.get('/api/products/grouped', authenticateToken, async (req, res) => {
  try {
    const productBatches = await ProductBatch.find({ userId: req.user.userId })
      .populate('baseProductId')
      .sort({ baseProductName: 1, expiryDate: 1 });
    
    // Group by base product
    const grouped = productBatches.reduce((acc, batch) => {
      const key = `${batch.baseProductName}-${batch.baseProductId.brand || 'No Brand'}`;
      if (!acc[key]) {
        acc[key] = {
          baseProduct: batch.baseProductId,
          batches: []
        };
      }
      acc[key].batches.push(batch);
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (error) {
    console.error('Get grouped products error:', error);
    res.status(500).json({ error: 'Server error fetching grouped products' });
  }
});

// Get products by base product name
app.get('/api/products/by-name/:name', authenticateToken, async (req, res) => {
  try {
    const batches = await ProductBatch.find({ 
      userId: req.user.userId,
      baseProductName: new RegExp(req.params.name, 'i') 
    }).populate('baseProductId').sort({ expiryDate: 1 });
    res.json(batches);
  } catch (error) {
    console.error('Get products by name error:', error);
    res.status(500).json({ error: 'Server error fetching products by name' });
  }
});

// Legacy Product Routes (for backward compatibility)
app.get('/api/products/legacy', authenticateToken, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.userId });
    res.json(products);
  } catch (error) {
    console.error('Get legacy products error:', error);
    res.status(500).json({ error: 'Server error fetching legacy products' });
  }
});

// Sales Routes (Protected)
app.get('/api/sales', authenticateToken, async (req, res) => {
  try {
    const sales = await Sales.find({ userId: req.user.userId });
    res.json(sales);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Server error fetching sales' });
  }
});

app.post('/api/sales', authenticateToken, async (req, res) => {
  try {
    const sale = new Sales({
      ...req.body,
      userId: req.user.userId
    });
    await sale.save();
    res.status(201).json(sale);
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Server error creating sale' });
  }
});

// Delete account endpoint
app.delete('/api/user/delete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Delete all user's product batches
    await ProductBatch.deleteMany({ userId });
    
    // Delete all user's base products
    await BaseProduct.deleteMany({ userId });
    
    // Delete all user's legacy products
    await Product.deleteMany({ userId });
    
    // Delete all user's sales
    await Sales.deleteMany({ userId });
    
    // Delete the user account
    const deletedUser = await User.findByIdAndDelete(userId);
    
    if (!deletedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ 
      message: 'Account and all associated data deleted successfully',
      deletedUser: {
        username: deletedUser.username,
        email: deletedUser.email
      }
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Server error deleting account' });
  }
});

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running!' });
});

// Serve React app for any non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const server = app.listen(PORT, () => {
  console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📊 MongoDB URI: ${MONGODB_URI}`);
  console.log(`🌐 Frontend available at: http://localhost:${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
    app.listen(PORT + 1, () => {
      console.log(`🚀 Backend server running on http://localhost:${PORT + 1}`);
      console.log(`📊 MongoDB URI: ${MONGODB_URI}`);
      console.log(`🌐 Frontend available at: http://localhost:${PORT + 1}`);
    });
  } else {
    console.error('❌ Server error:', err);
  }
});