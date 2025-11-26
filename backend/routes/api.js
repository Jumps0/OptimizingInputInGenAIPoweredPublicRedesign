const express = require('express');
const router = express.Router();

// Simple health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'Web Speech API Demo Backend',
    timestamp: new Date().toISOString()
  });
});

// You can add speech-related endpoints here later if needed
router.post('/speech-log', (req, res) => {
  // This could log speech data or process it further
  console.log('Speech data received:', req.body);
  res.json({ status: 'logged', timestamp: new Date().toISOString() });
});

module.exports = router;