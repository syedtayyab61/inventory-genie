const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS for all origins (needed for ngrok)
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tahayaseen:Passliya111@cluster0.pq5ap.mongodb.net/inventory-genie?retryWrites=true&w=majority';

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

connectToMongoDB();

// Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const BaseProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  unit: { type: String, default: 'pcs' },
  standardPrice: { type: Number },
  brand: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const ProductBatchSchema = new mongoose.Schema({
  baseProductId: { type: mongoose.Schema.Types.ObjectId, ref: 'BaseProduct', required: true },
  sku: { type: String, required: true, unique: true },
  batchNumber: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  supplier: { type: String },
  expiryDate: { type: Date, required: true },
  manufactureDate: { type: Date },
  notes: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', UserSchema);
const BaseProduct = mongoose.model('BaseProduct', BaseProductSchema);
const ProductBatch = mongoose.model('ProductBatch', ProductBatchSchema);

// Middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ error: 'Invalid token.' });
  }
};

// API Routes
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('User already exists:', username);
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    
    console.log('User created successfully:', username);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );
    
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/delete-account', verifyToken, async (req, res) => {
  try {
    await ProductBatch.deleteMany({ userId: req.user.userId });
    await BaseProduct.deleteMany({ userId: req.user.userId });
    await User.findByIdAndDelete(req.user.userId);
    
    res.json({ message: 'Account and all data deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Product routes
app.post('/api/products', verifyToken, async (req, res) => {
  try {
    const { baseProductData, batchData } = req.body;
    
    let baseProduct = await BaseProduct.findOne({
      name: baseProductData.name,
      userId: req.user.userId
    });
    
    if (!baseProduct) {
      baseProduct = new BaseProduct({
        ...baseProductData,
        userId: req.user.userId
      });
      await baseProduct.save();
    }
    
    const generateSKU = () => {
      const prefix = baseProductData.name.substring(0, 3).toUpperCase();
      const timestamp = Date.now().toString().slice(-6);
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      return `${prefix}-${timestamp}-${random}`;
    };
    
    const productBatch = new ProductBatch({
      ...batchData,
      baseProductId: baseProduct._id,
      sku: generateSKU(),
      userId: req.user.userId
    });
    
    await productBatch.save();
    
    const populatedBatch = await ProductBatch.findById(productBatch._id)
      .populate('baseProductId');
    
    res.status(201).json(populatedBatch);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products', verifyToken, async (req, res) => {
  try {
    const products = await ProductBatch.find({ userId: req.user.userId })
      .populate('baseProductId')
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products/grouped', verifyToken, async (req, res) => {
  try {
    const products = await ProductBatch.find({ userId: req.user.userId })
      .populate('baseProductId')
      .sort({ expiryDate: 1 });
    
    const grouped = products.reduce((acc, product) => {
      const productName = product.baseProductId.name;
      if (!acc[productName]) {
        acc[productName] = [];
      }
      acc[productName].push(product);
      return acc;
    }, {});
    
    res.json(grouped);
  } catch (error) {
    console.error('Error fetching grouped products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const product = await ProductBatch.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    ).populate('baseProductId');
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const product = await ProductBatch.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT,
    env: process.env.NODE_ENV || 'development'
  });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Integrated Server running at http://localhost:${PORT}`);
  console.log(`📊 MongoDB connected`);
  console.log(`🌐 Serving both API and frontend`);
  console.log(`✅ Ready for ngrok deployment`);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});
