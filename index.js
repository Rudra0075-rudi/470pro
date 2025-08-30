const express = require("express");

const User = require('./models/model');
const cors = require('cors');
const app = express();
const connectDB = require('./db');
require('dotenv').config();
const photoRoutes = require('./routs/photos');

const PORT = 3000;
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
 


// Connect to DB
connectDB();
//trips

const tripRoutes = require('./routs/trips.js');
app.use('/api/trips', tripRoutes);
app.use('/api/photos', photoRoutes); // Simple photo routes



app.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Basic validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create user - password will be hashed automatically by the model's pre-save hook
        const user = await User.create({ name, email, password });
        
        // Return response without the password
        res.status(201).json({ 
            message: "User created successfully", 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            } 
        });
    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ 
            message: "Something went wrong", 
            error: error.message 
        });
    }
});
// Login Route
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 2. Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    // 3. Successful login - return user data WITHOUT JWT
    res.json({ 
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});