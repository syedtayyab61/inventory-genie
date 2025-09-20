# MongoDB Setup Instructions

## Option 1: Local MongoDB Installation

1. **Download MongoDB Community Server:**
   - Visit: https://www.mongodb.com/try/download/community
   - Download and install for Windows

2. **Start MongoDB Service:**
   ```bash
   # Start MongoDB service (usually starts automatically after installation)
   net start MongoDB
   ```

3. **Verify MongoDB is running:**
   ```bash
   # Connect to MongoDB shell
   mongosh
   ```

## Option 2: MongoDB Atlas (Cloud - Recommended)

1. **Create MongoDB Atlas Account:**
   - Visit: https://www.mongodb.com/atlas
   - Sign up for a free account

2. **Create a Cluster:**
   - Choose "Create a Cluster"
   - Select "Free Shared" option
   - Choose a region close to you

3. **Get Connection String:**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

4. **Update .env file:**
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/inventory-genie?retryWrites=true&w=majority
   ```

## Option 3: MongoDB Compass (GUI)

1. **Download MongoDB Compass:**
   - Visit: https://www.mongodb.com/products/compass
   - Install the GUI tool

2. **Connect:**
   - Use connection string: `mongodb://localhost:27017`
   - Or connect to Atlas using your cluster connection string

## Quick Start Commands

```bash
# Install dependencies (if not already done)
npm install

# Start both backend and frontend
npm run dev

# Or start them separately:
# Terminal 1: Backend server
npm run backend

# Terminal 2: Frontend React app  
npm start
```

## Default URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **MongoDB:** mongodb://localhost:27017 (local) or Atlas connection string

## Test User Registration

Once everything is running:
1. Open http://localhost:3000
2. Click "Create Account"
3. Fill in username, email, password
4. Start managing your inventory!

## Troubleshooting

- **MongoDB Connection Error:** Make sure MongoDB is running or Atlas connection string is correct
- **Port 3000/5000 in use:** Close other applications using these ports
- **CORS errors:** Make sure backend server is running on port 5000