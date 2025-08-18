// Dashboard JavaScript
let allTrips = [];
let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  loadDashboardData();
});

function checkAuth() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!user.id) {
    window.location.href = 'login.html';
    return;
  }
  currentUser = user;
  document.getElementById('userName').textContent = user.name;
}

async function loadDashboardData() {
  try {
    const response = await fetch(`http://localhost:3000/api/trips?userId=${currentUser.id}`);
    if (!response.ok) throw new Error('Failed to fetch trips');
    allTrips = await response.json();
    updateDashboardStats();
    loadOverviewSection();
    loadAllTripsSection();
  } catch (error) {
    console.error('Error loading dashboard data:', error);
    alert('Failed to load dashboard data');
  }
}

function updateDashboardStats() {
  const totalTrips = allTrips.length;
  const upcomingTrips = allTrips.filter(t => t.status === 'upcoming').length;
  const completedTrips = allTrips.filter(t => t.status === 'completed').length;
  const totalSpent = allTrips.reduce((s, t) => s + (t.budget?.spent || 0), 0);
  document.getElementById('totalTrips').textContent = totalTrips;
  document.getElementById('upcomingTrips').textContent = upcomingTrips;
  document.getElementById('completedTrips').textContent = completedTrips;
  document.getElementById('totalSpent').textContent = `$${totalSpent.toLocaleString()}`;
}

function loadOverviewSection() {
  const recentTrips = allTrips.slice(0, 3);
  const upcomingTrips = allTrips.filter(t => t.status === 'upcoming').slice(0, 3);
  displayTripsGrid('recentTripsGrid', recentTrips);
  displayTripsGrid('upcomingTripsGrid', upcomingTrips);
}

function loadAllTripsSection() {
  displayTripsGrid('allTripsGrid', allTrips);
}

function displayTripsGrid(containerId, trips) {
  const container = document.getElementById(containerId);
  if (!trips || trips.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-plane"></i>
        <p>No trips found</p>
      </div>
    `;
    return;
  }
  container.innerHTML = trips.map(t => createTripCard(t)).join('');
}

function createTripCard(trip) {
  const start = formatDate(trip.startDate);
  const end = formatDate(trip.endDate);
  const spent = trip.budget?.spent || 0;
  const total = trip.budget?.total || 0;
  return `
    <div class="trip-card ${trip.status}" onclick="viewTrip('${trip._id}')">
      <div class="card-header">
        <div class="trip-title">
          <h3>${trip.title || 'Untitled Trip'}</h3>
          <div class="destination">${trip.destination || 'No destination'}</div>
        </div>
        <div class="status-badge ${trip.status}">${trip.status}</div>
      </div>
      <div class="card-dates"><span>${start}</span><span> to </span><span>${end}</span></div>
      ${total > 0 ? `<div class="budget-info">Budget: $${spent} / $${total}</div>` : ''}
      <div class="card-actions">
        <button class="btn-view" onclick="event.stopPropagation(); viewTrip('${trip._id}')">View</button>
        <button class="btn-edit" onclick="event.stopPropagation(); editTrip('${trip._id}')">Edit</button>
        <button class="btn-delete" onclick="event.stopPropagation(); deleteTrip('${trip._id}')">Delete</button>
      </div>
    </div>
  `;
}

function formatDate(d) {
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'Date not available';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showSection(sectionId) {
  document.querySelectorAll('.dashboard-section').forEach(s => s.classList.remove('active'));
  document.getElementById(sectionId).classList.add('active');
  document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
  const navItems = document.querySelectorAll('.nav-item');
  const idx = { overview:0, trips:1, upcoming:2, completed:3 }[sectionId];
  if (idx !== undefined) navItems[idx].classList.add('active');
  updateHeader(sectionId);
  if (sectionId === 'upcoming') displayTripsGrid('upcomingTripsGridFull', allTrips.filter(t => t.status === 'upcoming'));
  if (sectionId === 'completed') displayTripsGrid('completedTripsGrid', allTrips.filter(t => t.status === 'completed'));
}

function updateHeader(sectionId) {
  const titles = { overview:'Dashboard Overview', trips:'All My Trips', upcoming:'Upcoming Trips', completed:'Completed Trips' };
  const subtitles = { overview:"Welcome back! Here's your travel summary", trips:'Manage and organize all your trips', upcoming:'Your planned adventures', completed:"Trips you've completed" };
  document.getElementById('pageTitle').textContent = titles[sectionId] || 'Dashboard';
  document.getElementById('pageSubtitle').textContent = subtitles[sectionId] || '';
}

function filterTrips() {
  const f = document.getElementById('tripFilter').value;
  const list = f === 'all' ? allTrips : allTrips.filter(t => t.status === f);
  displayTripsGrid('allTripsGrid', list);
}

function searchTrips() {
  const term = document.getElementById('tripSearch').value.toLowerCase();
  const f = document.getElementById('tripFilter').value;
  let list = f === 'all' ? allTrips : allTrips.filter(t => t.status === f);
  if (term) {
    list = list.filter(t => (t.title||'').toLowerCase().includes(term) || (t.destination||'').toLowerCase().includes(term) || (t.notes||'').toLowerCase().includes(term));
  }
  displayTripsGrid('allTripsGrid', list);
}

function createNewTrip(){ window.location.href = 'creat_trip.html'; }
function viewAllTrips(){ showSection('trips'); }

function viewTrip(id){ localStorage.setItem('viewTripId', id); window.location.href = 'trips.html'; }
function editTrip(id){ localStorage.setItem('editTripId', id); window.location.href = 'trips.html'; }
async function deleteTrip(id){ if(!confirm('Are you sure you want to delete this trip?'))return; try{ const r=await fetch(`http://localhost:3000/api/trips/${id}`,{method:'DELETE'}); if(!r.ok) throw new Error('Failed to delete trip'); alert('Trip deleted successfully!'); loadDashboardData(); }catch(e){ console.error(e); alert('Failed to delete trip'); } }

function logout(){ localStorage.removeItem('user'); window.location.href='login.html'; }
