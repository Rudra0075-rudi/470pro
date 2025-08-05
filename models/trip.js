const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  destination: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['wishlist', 'upcoming', 'completed'], default: 'upcoming' },
  packingList: [{ item: String, packed: Boolean }],
  budget: { total: Number, spent: Number },
  notes: String
}, { timestamps: true });

module.exports = mongoose.model('Trip', tripSchema);