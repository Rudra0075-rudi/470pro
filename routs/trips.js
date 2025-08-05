const express = require('express');
const Trip = require('../models/trip');
const router = express.Router();

// Get trips with error handling
router.get('/', async (req, res) => {
  try {
    if (!req.query.userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const trips = await Trip.find({ userId: req.query.userId })
      .sort({ startDate: 1 }) // Sort by start date
      .lean(); // Return plain JS objects

    res.json(trips);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ 
      error: "Server error",
      details: error.message 
    });
  }
});

// Delete trip endpoint
router.delete('/:id', async (req, res) => {
  try {
    const deletedTrip = await Trip.findByIdAndDelete(req.params.id);
    
    if (!deletedTrip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    
    res.json({ message: "Trip deleted successfully" });
  } catch (error) {
    res.status(500).json({ 
      error: "Failed to delete trip",
      details: error.message 
    });
  }
});

module.exports = router;