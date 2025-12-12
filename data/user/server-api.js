// Simple Express server to handle booking requests
// Run this with: node server-api.js

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors()); // Enable CORS for development

// Serve static `data` folder from repository root at `/data` so admin UI can access
// JSON files without adding anything inside `user/`.
const dataPath = path.join(__dirname, '..', 'data');
const repoDataDir = dataPath; // repository-level data directory (../data)
if (fs.existsSync(dataPath)) {
  app.use('/data', express.static(dataPath));
}

// // Prefer serving the static admin UI from `admin/public` at repository root.
// // This allows running the admin UI without building or running React.
// const adminPublicPath = path.join(__dirname, '..', 'admin', 'public');
// const adminPath = path.join(__dirname, '..', 'admin');
// if (fs.existsSync(adminPublicPath)) {
//   app.use('/', express.static(adminPublicPath));
//   app.get('/', (req, res) => res.sendFile(path.join(adminPublicPath, 'index.html')));
// } else if (fs.existsSync(adminPath) && fs.existsSync(path.join(adminPath, 'index.html'))) {
//   // Older projects may have an index.html directly in `admin/`
//   app.use('/', express.static(adminPath));
//   app.get('/', (req, res) => res.sendFile(path.join(adminPath, 'index.html')));
// } else {
//   // Fallback to serving current directory (original behavior)
//   app.use(express.static('.'));
// }

// API endpoint to save new requests to requests.json
app.post('/api/requests', (req, res) => {
  try {
    const newRequest = req.body;
    // Read current requests.json from repository-level data folder
    const requestsPath = path.join(repoDataDir, 'requests.json');
    let requestsData = { requests: [] };
    if (fs.existsSync(requestsPath)) {
      requestsData = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
    }

    // Ensure array exists
    if (!Array.isArray(requestsData.requests)) requestsData.requests = [];

    // Add new request to the end
    requestsData.requests.push(newRequest);

    // Save back to file (repo-level)
    fs.writeFileSync(requestsPath, JSON.stringify(requestsData, null, 2), 'utf8');
    
    console.log('✅ New request saved:', newRequest.id);
    
    res.status(200).json({
      success: true,
      message: 'Request saved successfully',
      request: newRequest
    });
    
  } catch (error) {
    console.error('❌ Error saving request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save request',
      error: error.message
    });
  }
});

// API endpoint to get all requests
app.get('/api/requests', (req, res) => {
  try {
    const requestsPath = path.join(repoDataDir, 'requests.json');
    if (!fs.existsSync(requestsPath)) {
      return res.status(200).json({ requests: [] });
    }
    const requestsData = JSON.parse(fs.readFileSync(requestsPath, 'utf8'));
    res.status(200).json(requestsData);
  } catch (error) {
    console.error('❌ Error reading requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to read requests',
      error: error.message
    });
  }
});

// API endpoint to save bookings (when admin approves)
app.post('/api/bookings', (req, res) => {
  try {
    const newBooking = req.body;
    // Read current bookings.json from repository-level data folder
    const bookingsPath = path.join(repoDataDir, 'bookings.json');
    let bookingsData = { bookings: [] };
    if (fs.existsSync(bookingsPath)) {
      bookingsData = JSON.parse(fs.readFileSync(bookingsPath, 'utf8'));
    }
    if (!Array.isArray(bookingsData.bookings)) bookingsData.bookings = [];
    bookingsData.bookings.push(newBooking);
    fs.writeFileSync(bookingsPath, JSON.stringify(bookingsData, null, 2), 'utf8');
    
    console.log('✅ New booking saved:', newBooking.id);
    
    res.status(200).json({
      success: true,
      message: 'Booking saved successfully',
      booking: newBooking
    });
    
  } catch (error) {
    console.error('❌ Error saving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save booking',
      error: error.message
    });
  }
});

// API endpoint to update request status
app.patch('/api/requests/:id', (req, res) => {
  try {
    const requestId = req.params.id;
    const updates = req.body;
    
    // Read current requests.json
    const requestsPath = path.join(repoDataDir, 'requests.json');
    const requestsData = fs.existsSync(requestsPath) ? JSON.parse(fs.readFileSync(requestsPath, 'utf8')) : { requests: [] };
    
    // Find and update the request
    const requestIndex = requestsData.requests.findIndex(r => r.id === requestId);
    
    if (requestIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Update the request
    requestsData.requests[requestIndex] = {
      ...requestsData.requests[requestIndex],
      ...updates
    };
    
    // Save back to file
    fs.writeFileSync(requestsPath, JSON.stringify(requestsData, null, 2), 'utf8');
    
    console.log('✅ Request updated:', requestId);
    
    res.status(200).json({
      success: true,
      message: 'Request updated successfully',
      request: requestsData.requests[requestIndex]
    });
    
  } catch (error) {
    console.error('❌ Error updating request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update request',
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║   🚀 BCHS Booking Server Running!             ║
║                                                ║
║   Server URL: http://localhost:${PORT}/         ║
║   Admin Panel: http://localhost:${PORT}/        ║
║   User App: http://localhost:${PORT}/           ║
║                                                ║
║   API Endpoints:                               ║
║   POST   /api/requests  - Create new request  ║
║   GET    /api/requests  - Get all requests    ║
║   PATCH  /api/requests/:id - Update request   ║
║   POST   /api/bookings  - Create new booking  ║
╚════════════════════════════════════════════════╝
  `);
});
