const express = require('express');
const Photo = require('../models/photo');
const upload = require('../middleware/upload');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// GET photo count for a trip (for performance)
router.get('/:tripId/count', async (req, res) => {
  try {
    const { tripId } = req.params;
    const count = await Photo.countDocuments({ tripId });
    res.json({ count });
  } catch (error) {
    console.error('Error getting photo count:', error);
    res.status(500).json({ error: 'Failed to get photo count', details: error.message });
  }
});

// GET all photos for a specific trip
router.get('/:tripId/photos', async (req, res) => {
  try {
    const { tripId } = req.params;
    console.log(' Fetching photos for trip:', tripId);
    
    const photos = await Photo.find({ tripId }).sort({ createdAt: -1 });
    
    // Add URL to each photo for frontend access
    const photosWithUrls = photos.map(photo => ({
      _id: photo._id,
      filename: photo.filename,
      originalName: photo.originalName,
      uploadDate: photo.createdAt,
      url: `http://localhost:3000/uploads/${tripId}/${photo.filename}`
    }));
    
    console.log(' Found', photosWithUrls.length, 'photos for trip', tripId);
    res.json(photosWithUrls);
    
  } catch (error) {
    console.error(' Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos', details: error.message });
  }
});

// UPLOAD photos to a trip
router.post('/:tripId/upload', upload.array('photos', 10), async (req, res) => {
  try {
    const { tripId } = req.params;
    console.log('📤 Upload request for trip:', tripId);
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    console.log(' Files received:', req.files.length);
    
    // Save photo metadata to database
    const savedPhotos = [];
    for (const file of req.files) {
      try {
        const photo = new Photo({
          tripId: tripId,
          filename: file.filename,
          originalName: file.originalname
        });
        
        const savedPhoto = await photo.save();
        savedPhotos.push(savedPhoto);
        console.log('Saved photo:', file.originalname);
        
      } catch (saveError) {
        console.error(' Error saving photo to DB:', saveError);
        // Delete the uploaded file if DB save fails
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }

    // Return photos with URLs
    const photosWithUrls = savedPhotos.map(photo => ({
      _id: photo._id,
      filename: photo.filename,
      originalName: photo.originalName,
      uploadDate: photo.createdAt,
      url: `http://localhost:3000/uploads/${tripId}/${photo.filename}`
    }));

    res.status(201).json({
      message: 'Photos uploaded successfully',
      photos: photosWithUrls,
      count: savedPhotos.length
    });

  } catch (error) {
    console.error(' Upload error:', error);
    
    // Clean up any uploaded files on error
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    res.status(500).json({ error: 'Failed to upload photos', details: error.message });
  }
});

// DELETE a specific photo
router.delete('/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    console.log(' Delete request for photo:', photoId);
    
    // Find the photo first
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Delete the file from filesystem
    const filePath = path.join(__dirname, '../uploads', photo.tripId, photo.filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(' Deleted file:', filePath);
    } else {
      console.log('File not found, but proceeding with DB deletion:', filePath);
    }

    // Delete from database
    await Photo.findByIdAndDelete(photoId);
    console.log(' Deleted from database');

    res.json({ message: 'Photo deleted successfully' });

  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete photo', details: error.message });
  }
});

// Test route
router.get('/test/hello', (req, res) => {
  res.json({ message: 'Photos API is working!' });
});

// Test route to list all photos (for debugging)
router.get('/test/list', async (req, res) => {
  try {
    const photos = await Photo.find({}).limit(5);
    res.json({ 
      message: 'Photos list', 
      count: photos.length,
      photos: photos.map(p => ({ id: p._id, tripId: p.tripId, filename: p.filename, originalName: p.originalName }))
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to list photos', details: error.message });
  }
});

// DOWNLOAD photo endpoint
router.get('/download/:photoId', async (req, res) => {
  try {
    const { photoId } = req.params;
    console.log('📥 Download request for photo:', photoId);
    
    // Find the photo in database
    const photo = await Photo.findById(photoId);
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // Construct file path
    const filePath = path.join(__dirname, '../uploads', photo.tripId, photo.filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Photo file not found' });
    }

    // Set proper headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${photo.originalName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Send the file
    res.sendFile(filePath);
    
    console.log('✅ Photo downloaded:', photo.originalName);

  } catch (error) {
    console.error('❌ Download error:', error);
    res.status(500).json({ error: 'Failed to download photo', details: error.message });
  }
});

module.exports = router;