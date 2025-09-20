const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://tahayaseen:Passliya111@cluster0.pq5ap.mongodb.net/inventory-genie?retryWrites=true&w=majority';

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Product Schema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  purchasePrice: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  quantity: { type: Number, required: true },
  reorderLevel: { type: Number, default: 10 },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

// Sale Schema
const saleSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String, required: true },
  quantitySold: { type: Number, required: true },
  sellingPrice: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  saleDate: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Sale = mongoose.model('Sale', saleSchema);

async function clearAllData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear all collections
    console.log('🗑️  Clearing all users...');
    const usersDeleted = await User.deleteMany({});
    console.log(`✅ Deleted ${usersDeleted.deletedCount} users`);

    console.log('🗑️  Clearing all products...');
    const productsDeleted = await Product.deleteMany({});
    console.log(`✅ Deleted ${productsDeleted.deletedCount} products`);

    console.log('🗑️  Clearing all sales...');
    const salesDeleted = await Sale.deleteMany({});
    console.log(`✅ Deleted ${salesDeleted.deletedCount} sales records`);

    console.log('\n🎉 ALL DATA CLEARED SUCCESSFULLY!');
    console.log('📊 Summary:');
    console.log(`   - Users: ${usersDeleted.deletedCount} deleted`);
    console.log(`   - Products: ${productsDeleted.deletedCount} deleted`);
    console.log(`   - Sales: ${salesDeleted.deletedCount} deleted`);

  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the clear operation
clearAllData();