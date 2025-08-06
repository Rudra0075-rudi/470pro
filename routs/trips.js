
const express = require('express');
const Trip = require('../models/trip');
const router = express.Router();

// POST endpoint for creating trips
router.post('/', async (req, res) => {
  try {
    // Validate required fields
    if (!req.body.title || !req.body.destination || !req.body.startDate || !req.body.endDate || !req.body.userId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Create new trip
    const trip = new Trip({
      title: req.body.title,
      destination: req.body.destination,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      status: req.body.status || 'upcoming',
      packingList: req.body.packingList || [],
      budget: req.body.budget || { total: 0, spent: 0 },
      notes: req.body.notes || '',
      userId: req.body.userId
    });

    // Save to database
    await trip.save();
    
    // Return created trip
    res.status(201).json(trip);
    
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(500).json({ 
      error: "Failed to create trip",
      details: error.message 
    });
  }
});
// GET trips for a user
router.get('/', async (req, res) => {
    try {
        const trips = await Trip.find({ userId: req.query.userId });
        res.json(trips);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



module.exports = router;
