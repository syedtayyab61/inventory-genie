const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// CORS configuration - allow all origins for ngrok
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB connection with improved error handling
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tahayaseen:Passliya111@cluster0.pq5ap.mongodb.net/inventory-genie?retryWrites=true&w=majority';

// Connect to MongoDB with retry logic
let retryCount = 0;
const maxRetries = 5;

const connectToMongoDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas');
    retryCount = 0; // Reset retry count on successful connection
  } catch (error) {
    retryCount++;
    console.error(`❌ MongoDB connection error (attempt ${retryCount}/${maxRetries}):`, error.message);
    
    if (retryCount < maxRetries) {
      console.log(`⏳ Retrying in 5 seconds...`);
      setTimeout(connectToMongoDB, 5000);
    } else {
      console.error('❌ Max retry attempts reached. Exiting...');
      process.exit(1);
    }
  }
};

connectToMongoDB();

// Fix database index issue
const fixDatabaseIndexes = async () => {
  try {
    const db = mongoose.connection.db;
    const collection = db.collection('users');
    
    // Try to drop the email index if it exists
    try {
      await collection.dropIndex('email_1');
      console.log('✅ Dropped email index from users collection');
    } catch (error) {
      if (error.code === 27) {
        console.log('✅ Email index does not exist (this is fine)');
      } else {
        console.log('⚠️ Could not drop email index:', error.message);
      }
    }
  } catch (error) {
    console.log('⚠️ Database index fix error:', error.message);
  }
};

// Call fix after connection
mongoose.connection.once('open', fixDatabaseIndexes);

// Schemas
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  supplier: { type: String },
  description: { type: String },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SaleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, default: Date.now }
});

// Create models
const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);
const Sale = mongoose.model('Sale', SaleSchema);

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

// Routes
app.post('/api/register', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    console.log('Checking for existing user:', username);
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log('User already exists:', username);
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    console.log('Hashing password for user:', username);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    
    console.log('Saving user to database:', username);
    await user.save();
    
    console.log('User created successfully:', username);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Registration error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ error: 'Internal server error', details: error.message });
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
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        username: user.username 
      } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/delete-account', verifyToken, async (req, res) => {
  try {
    await Product.deleteMany({ userId: req.user.userId });
    await Sale.deleteMany({ userId: req.user.userId });
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
    const product = new Product({
      ...req.body,
      userId: req.user.userId
    });
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/products', verifyToken, async (req, res) => {
  try {
    const products = await Product.find({ userId: req.user.userId })
      .sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/products/:id', verifyToken, async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    
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
    const product = await Product.findOneAndDelete({
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

// Sales routes
app.post('/api/sales', verifyToken, async (req, res) => {
  try {
    const sale = new Sale({
      ...req.body,
      userId: req.user.userId
    });
    await sale.save();
    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/sales', verifyToken, async (req, res) => {
  try {
    const sales = await Sale.find({ userId: req.user.userId })
      .sort({ date: -1 });
    res.json(sales);
  } catch (error) {
    console.error('Error fetching sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/sales', verifyToken, async (req, res) => {
  try {
    await Sale.deleteMany({ userId: req.user.userId });
    res.json({ message: 'All sales records cleared successfully' });
  } catch (error) {
    console.error('Error clearing sales:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all user data (products and sales)
app.delete('/api/clear-database', verifyToken, async (req, res) => {
  try {
    // Clear all products for the user
    await Product.deleteMany({ userId: req.user.userId });
    // Clear all sales for the user
    await Sale.deleteMany({ userId: req.user.userId });
    
    res.json({ 
      message: 'Database cleared successfully',
      details: 'All products and sales records have been removed for your account'
    });
  } catch (error) {
    console.error('Error clearing database:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clear all users (admin function - removes all accounts, products, and sales)
app.delete('/api/clear-all-users', async (req, res) => {
  try {
    // Clear all users
    const usersDeleted = await User.deleteMany({});
    // Clear all products
    const productsDeleted = await Product.deleteMany({});
    // Clear all sales
    const salesDeleted = await Sale.deleteMany({});
    
    res.json({ 
      message: 'All users and data cleared successfully',
      details: {
        usersDeleted: usersDeleted.deletedCount,
        productsDeleted: productsDeleted.deletedCount,
        salesDeleted: salesDeleted.deletedCount
      }
    });
  } catch (error) {
    console.error('Error clearing all users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API Server running at http://localhost:${PORT}`);
  console.log(`📊 MongoDB connected to: ${MONGODB_URI.split('@')[1]?.split('?')[0] || 'database'}`);
  console.log('✅ API server ready for requests');
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
});