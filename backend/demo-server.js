const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5003;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for demo (replace with MongoDB later)
let users = [];
let products = [];
let sales = [];

const JWT_SECRET = 'demo-secret-key';

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend server is running in demo mode!' });
});

// Register endpoint
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
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ 
        error: existingUser.email === email ? 'Email already registered' : 'Username already taken' 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = {
      id: Date.now().toString(),
      username,
      email,
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    users.push(user);

    // Generate JWT token
    const token = jwt.sign({ 
      userId: user.id, 
      username: user.username 
    }, JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = users.find(u => u.email === email.toLowerCase());
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
      userId: user.id, 
      username: user.username 
    }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

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

// Protected routes
app.get('/api/products', authenticateToken, (req, res) => {
  const userProducts = products.filter(p => p.userId === req.user.userId);
  res.json(userProducts);
});

app.post('/api/products', authenticateToken, (req, res) => {
  const product = {
    _id: Date.now().toString(),
    ...req.body,
    userId: req.user.userId,
    dateAdded: new Date().toISOString()
  };
  products.push(product);
  res.status(201).json(product);
});

app.get('/api/sales', authenticateToken, (req, res) => {
  const userSales = sales.filter(s => s.userId === req.user.userId);
  res.json(userSales);
});

app.post('/api/sales', authenticateToken, (req, res) => {
  const sale = {
    _id: Date.now().toString(),
    ...req.body,
    userId: req.user.userId,
    date: new Date().toISOString()
  };
  sales.push(sale);
  res.status(201).json(sale);
});

app.listen(PORT, () => {
  console.log(`🚀 Demo Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Using in-memory storage (no MongoDB required)`);
  console.log(`🎯 Ready for user registration and login!`);
});