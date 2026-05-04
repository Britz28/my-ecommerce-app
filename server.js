// This is the tiny server file. It runs in Node and talks to PayNow and MongoDB.
// The comments are honest and easy to follow, even if you are not into code.

require('dotenv').config({ path: '.env.local' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Paynow } = require('paynow');
const mongoose = require('mongoose');
const crypto = require('crypto');

// Helper to hash passwords
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Start the app that listens for requests.
const app = express();
app.use(cors()); // Allow frontend to call backend if on different ports
app.use(bodyParser.json()); // make sure we can read the stuff the browser sends

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ecommerce';

// Initial products to seed the database if it's empty
const initialProducts = [
  {
    id: 1,
    name: 'Pure Glow Serum',
    description: 'Hydrating vitamin C serum for radiant skin.',
    price: 24.99,
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 2,
    name: 'Luxury Face Cream',
    description: 'Deep-moisture cream for all skin types.',
    price: 42.5,
    image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=400&fit=crop',
  },
  {
    id: 3,
    name: 'Liquid Foundation',
    description: 'Full coverage foundation with a natural matte finish.',
    price: 28.99,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 4,
    name: 'Rose Gold Blush',
    description: 'Silky smooth blush with a natural rose gold finish.',
    price: 22.99,
    image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=400&q=80',
  },
];

// Define Mongoose Schemas and Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  created_at: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: Array,
  total: Number,
  email: String,
  phone: String,
  method: String,
  status: { type: String, default: 'pending' },
  paynow_reference: String,
  created_at: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  id: Number,
  name: String,
  description: String,
  price: Number,
  image: String
});

const User = mongoose.model('User', userSchema);
const Order = mongoose.model('Order', orderSchema);
const Product = mongoose.model('Product', productSchema);

// Function to seed products if none exist
async function seedProducts() {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('No products found in the database. Seeding initial products...');
      await Product.insertMany(initialProducts);
      console.log('Successfully seeded products!');
    }
  } catch (error) {
    console.error('Error seeding products:', error);
  }
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully!');
    seedProducts();
  })
  .catch(err => console.error('Failed to connect to MongoDB:', err));

// This is where you put your PayNow keys. If you don't, the payment will not work.
const paynow = new Paynow(
  process.env.PAYNOW_INTEGRATION_ID || 'YOUR_INTEGRATION_ID',
  process.env.PAYNOW_INTEGRATION_KEY || 'YOUR_INTEGRATION_KEY',
);

// PayNow needs to know where to send results and where to return the shopper.
paynow.resultUrl = process.env.PAYNOW_RESULT_URL || 'http://localhost:3000/paynow-result';
paynow.returnUrl = process.env.PAYNOW_RETURN_URL || 'http://localhost:3000/paynow-return';

// Authentication Endpoints
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password are required' });
  
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ success: false, error: 'Email already exists' });
    
    const user = await User.create({ email, password: hashPassword(password) });
    return res.json({ success: true, user: { id: user._id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, password: hashPassword(password) });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    return res.json({ success: true, user: { id: user._id, email: user.email } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// This is the route the browser hits when the shopper clicks the PayNow button.
app.post('/api/paynow', async (req, res) => {
  const { userId, items, reference, email, phone, method } = req.body;

  // If the cart is empty, the server refuses to proceed.
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ success: false, error: 'Cart items are required' });
  }

  // If anything important is missing, we tell the browser to fix it.
  if (!reference || !email || !phone || !method) {
    return res.status(400).json({ success: false, error: 'Missing payment details' });
  }

  // Create a PayNow payment and add every product in the cart to it.
  const payment = paynow.createPayment(reference, email);
  items.forEach((item) => {
    payment.add(item.name, item.price);
  });

  try {
    // This is the key step: we ask PayNow to send mobile money instructions.
    let response;
    const isMock = process.env.PAYNOW_INTEGRATION_ID === 'YOUR_INTEGRATION_ID' || !process.env.PAYNOW_INTEGRATION_ID;
    
    if (isMock) {
      console.log('Using Mock PayNow Payment due to placeholder keys.');
      response = {
        success: true,
        instructions: 'Mock Payment Successful! Dial *151*2*1# to confirm.',
        pollUrl: 'http://localhost:5000/mock-poll',
        status: 'Paid',
        paynowReference: 'MOCK-' + Date.now(),
      };
    } else {
      response = await paynow.sendMobile(payment, phone, method);
    }

    if (!response.success) {
      return res.status(400).json({
        success: false,
        error: response.error || 'PayNow mobile payment could not be created',
      });
    }

    // Save the order to MongoDB for record keeping.
    try {
      await Order.create({
        userId: userId || null,
        items: items,
        total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        email: email,
        phone: phone,
        method: method,
        status: 'pending',
        paynow_reference: response.paynowReference,
      });
    } catch (dbError) {
      console.error('Failed to save order to MongoDB:', dbError);
      // Continue anyway - payment was created, just log the DB error
    }

    // If PayNow says yes, we send the instructions back to the browser.
    return res.json({
      success: true,
      instructions: response.instructions,
      pollUrl: response.pollUrl,
      status: response.status,
      paynowReference: response.paynowReference,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch all products from MongoDB database.
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({});
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Fetch orders for a specific email (for order history).
app.get('/api/orders/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const orders = await Order.find({ email }).sort({ created_at: -1 });
    return res.json({ success: true, orders });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Backend running at http://localhost:${port}`);
});
