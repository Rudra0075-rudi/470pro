// ===== SIMPLIFIED PHOTO GALLERY =====
let allTrips = [];
let currentUser = null;

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadTrips();
});

// Load all trips and their photo counts
async function loadTrips() {
    console.log('🔄 Loading trips...');
    const container = document.getElementById('tripCardsContainer');
    
    try {
        // Show loading
        container.innerHTML = '<div class="loading-spinner"></div><p>Loading your trips...</p>';
        
        // Check if user is logged in
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user.id) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>Please login first</p>
                    <a href="login.html" class="btn">Login</a>
                </div>
            `;
            return;
        }

        currentUser = user;

        // Load trips
        const response = await fetch(`http://localhost:3000/api/trips?userId=${user.id}`);
        if (!response.ok) throw new Error(`Failed to load trips: ${response.status}`);
        
        allTrips = await response.json();
        console.log(' Trips loaded:', allTrips.length);
        
        // Load photo counts for each trip
        await loadPhotoCounts();
        
        // Display trips
        displayTripCards();
        
    } catch (error) {
        console.error(' Error loading trips:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Failed to load trips: ${error.message}</p>
                <button onclick="loadTrips()">Try Again</button>
            </div>
        `;
    }
}

// Load photo counts for all trips
async function loadPhotoCounts() {
    console.log('📸 Loading photo counts...');
    console.log('Total trips to process:', allTrips.length);
    
    for (let trip of allTrips) {
        try {
            console.log(`Loading count for trip: ${trip._id} (${trip.title})`);
            
            // Try the count endpoint first
            const countResponse = await fetch(`http://localhost:3000/api/photos/${trip._id}/count`);
            console.log(`Count response status for ${trip._id}:`, countResponse.status);
            
            if (countResponse.ok) {
                const data = await countResponse.json();
                trip.photoCount = data.count;
                console.log(`✅ Trip ${trip.title}: ${data.count} photos (from count endpoint)`);
            } else {
                // Fallback: load all photos and count them
                console.log(`Count endpoint failed, trying fallback for ${trip._id}`);
                const photosResponse = await fetch(`http://localhost:3000/api/photos/${trip._id}/photos`);
                
                if (photosResponse.ok) {
                    const photos = await photosResponse.json();
                    trip.photoCount = photos.length;
                    console.log(`✅ Trip ${trip.title}: ${photos.length} photos (from photos endpoint)`);
                } else {
                    trip.photoCount = 0;
                    console.log(`❌ Trip ${trip.title}: 0 photos (both endpoints failed)`);
                }
            }
        } catch (error) {
            console.error(` Error loading photo count for trip ${trip._id}:`, error);
            trip.photoCount = 0;
        }
    }
    console.log(' Photo counts loaded:', allTrips.map(t => `${t.title}: ${t.photoCount}`));
}

// Display trip cards with photo counts
function displayTripCards() {
    const container = document.getElementById('tripCardsContainer');
    
    if (!allTrips || allTrips.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-plane"></i>
                <p>No trips found. Create your first trip!</p>
                <a href="creat_trip.html" class="btn">Create Trip</a>
            </div>
        `;
        return;
    }

    container.innerHTML = allTrips.map(trip => `
        <div class="trip-card ${trip.status || ''}">
            <div class="card-header">
                <div class="trip-title">
                    <h3>${trip.title || 'Untitled Trip'}</h3>
                    <div class="destination">${trip.destination || 'No destination'}</div>
                </div>
                <div class="status-bubble ${trip.status || ''}">${trip.status || 'unknown'}</div>
            </div>
            <div class="card-dates">
                <span>${formatDate(trip.startDate)}</span>
                <span>to</span>
                <span>${formatDate(trip.endDate)}</span>
            </div>
            <div class="card-photos">
                <div class="photo-count">
                    <i class="fas fa-camera"></i>
                    <span>${trip.photoCount || 0} photos</span>
                </div>
            </div>
            <div class="card-actions">
                <button class="btn-view" onclick="viewTripPhotos('${trip._id}', '${trip.title}')">
                    View Photos
                </button>
                <button class="btn-upload" onclick="uploadToTrip('${trip._id}')">
                    Add Photos
                </button>
            </div>
        </div>
    `).join('');
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// View photos for a trip
async function viewTripPhotos(tripId, tripTitle) {
    console.log('📸 Opening photos for trip:', tripId);
    
    // Set current trip ID for modal uploads
    window.currentTripId = tripId;
    
    // Show modal
    const modal = document.getElementById('photoModal');
    const titleElement = document.getElementById('modalTripTitle');
    titleElement.textContent = `Photos: ${tripTitle}`;
    modal.style.display = 'block';
    
    // Load and display photos
    await loadAndDisplayPhotos(tripId);
}

// Load and display photos
async function loadAndDisplayPhotos(tripId) {
    try {
        const response = await fetch(`http://localhost:3000/api/photos/${tripId}/photos`);
        if (!response.ok) throw new Error(`Failed to load photos: ${response.status}`);
        
        const photos = await response.json();
        displayPhotos(photos);
        
        // Update photo count in trip list
        updateTripPhotoCount(tripId, photos.length);
        
    } catch (error) {
        console.error('Error loading photos:', error);
        displayPhotos([]);
    }
}

// Display photos in modal
function displayPhotos(photos) {
    console.log('🖼️ Displaying photos:', photos.length);
    const photosGrid = document.getElementById('photosGrid');
    
    if (photos.length === 0) {
        photosGrid.innerHTML = `
            <div class="empty-photos">
                <i class="fas fa-camera"></i>
                <p>No photos yet. Upload some memories!</p>
            </div>
        `;
        return;
    }

    photosGrid.innerHTML = photos.map((photo, index) => `
        <div class="photo-item">
            <div class="photo-container">
                <img src="${photo.url}" alt="${photo.originalName}" 
                     onclick="viewPhoto('${photo.url}', '${photo.originalName}')"
                     onerror="this.style.display='none'">
                <div class="photo-overlay">
                    <button class="btn-view-photo" onclick="viewPhoto('${photo.url}', '${photo.originalName}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn-download-photo" onclick="downloadPhoto('${photo.url}', '${photo.originalName}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn-delete-photo" onclick="deletePhoto('${photo._id}', '${window.currentTripId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="photo-info">
                <span class="photo-name">${photo.originalName}</span>
                <span class="photo-date">${formatDate(photo.uploadDate)}</span>
            </div>
        </div>
    `).join('');
}

// Upload photos to a trip
function uploadToTrip(tripId) {
    console.log('📤 Starting upload for trip:', tripId);
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*';
    
    fileInput.onchange = async (e) => {
        const files = e.target.files;
        if (files.length === 0) return;
        
        try {
            console.log(`📁 Uploading ${files.length} files...`);
            
            const formData = new FormData();
            for (let file of files) {
                formData.append('photos', file);
            }

            const response = await fetch(`http://localhost:3000/api/photos/${tripId}/upload`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || errorData.message || `Upload failed: ${response.status}`);
            }

            const result = await response.json();
            console.log(' Upload successful:', result);
            
            alert(`Successfully uploaded ${result.photos.length} photos!`);
            
            // Refresh photo display if modal is open
            if (window.currentTripId === tripId && document.getElementById('photoModal').style.display === 'block') {
                await loadAndDisplayPhotos(tripId);
            }
            
            // Update trip list
            await loadPhotoCounts();
            displayTripCards();
            
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
        }
    };
    
    fileInput.click();
}

// Delete a photo
async function deletePhoto(photoId, tripId) {
    if (!confirm('Are you sure you want to delete this photo?')) return;
    
    try {
        console.log('🗑️ Deleting photo:', photoId);
        
        const response = await fetch(`http://localhost:3000/api/photos/${photoId}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || `Delete failed: ${response.status}`);
        }

        console.log('✅ Photo deleted successfully');
        
        // Refresh photo display
        await loadAndDisplayPhotos(tripId);
        
        // Update trip list
        await loadPhotoCounts();
        displayTripCards();
        
    } catch (error) {
        console.error('Delete error:', error);
        alert('Failed to delete photo: ' + error.message);
    }
}

// Update photo count for a specific trip
function updateTripPhotoCount(tripId, count) {
    const trip = allTrips.find(t => t._id === tripId);
    if (trip) {
        trip.photoCount = count;
    }
}

// View a single photo in full screen
function viewPhoto(photoUrl, photoName) {
    console.log('👁️ Viewing photo:', photoName);
    
    // Create full-screen photo viewer
    const viewer = document.createElement('div');
    viewer.className = 'photo-viewer';
    viewer.innerHTML = `
        <div class="photo-viewer-content">
            <div class="photo-viewer-header">
                <h3>${photoName}</h3>
                <div class="photo-viewer-actions">
                    <button onclick="downloadPhoto('${photoUrl}', '${photoName}')" class="btn-download">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button onclick="closePhotoViewer()" class="btn-close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="photo-viewer-body">
                <img src="${photoUrl}" alt="${photoName}" onclick="closePhotoViewer()">
            </div>
        </div>
    `;
    
    document.body.appendChild(viewer);
    document.body.style.overflow = 'hidden';
}

// Close photo viewer
function closePhotoViewer() {
    const viewer = document.querySelector('.photo-viewer');
    if (viewer) {
        viewer.remove();
        document.body.style.overflow = 'auto';
    }
}

// Download a photo
function downloadPhoto(photoUrl, photoName) {
    console.log('📥 Downloading photo:', photoName);
    
    // Create a temporary link to download the photo
    const link = document.createElement('a');
    link.href = photoUrl;
    link.download = photoName;
    link.target = '_blank';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Download initiated for:', photoName);
}

// Close photo modal
function closePhotoModal() {
    document.getElementById('photoModal').style.display = 'none';
    window.currentTripId = null;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('photoModal');
    if (event.target === modal) {
        closePhotoModal();
    }
};

// Modal upload functionality
const uploadArea = document.getElementById('uploadArea');
const photoInput = document.getElementById('photoUpload');

if (uploadArea && photoInput) {
    // Click to upload
    uploadArea.addEventListener('click', () => {
        photoInput.click();
    });
    
    // Drag and drop
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('drag-over');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('drag-over');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0 && window.currentTripId) {
            uploadFilesFromModal(files);
        }
    });
    
    // File input change
    photoInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length > 0 && window.currentTripId) {
            uploadFilesFromModal(files);
        }
    });
}

// Upload files from modal
async function uploadFilesFromModal(files) {
    if (!window.currentTripId) {
        alert('No trip selected for upload');
        return;
    }
    
    try {
        console.log(`📤 Uploading ${files.length} files from modal...`);
        
        const formData = new FormData();
        for (let file of files) {
            formData.append('photos', file);
        }

        const response = await fetch(`http://localhost:3000/api/photos/${window.currentTripId}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || `Upload failed: ${response.status}`);
        }

        const result = await response.json();
        console.log('✅ Modal upload successful:', result);
        
        alert(`Successfully uploaded ${result.photos.length} photos!`);
        
        // Refresh displays
        await loadAndDisplayPhotos(window.currentTripId);
        await loadPhotoCounts();
        displayTripCards();
        
        // Clear file input
        document.getElementById('photoUpload').value = '';
        
    } catch (error) {
        console.error(' Modal upload error:', error);
        alert('Upload failed: ' + error.message);
    }
}