const mongoose = require('mongoose');

const photoSchema = new mongoose.Schema({
  tripId: String, 
  filename: String,
  originalName: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Photo', photoSchema);