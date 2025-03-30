const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: {
      status: 'connected',
      state: mongoose.connection.readyState
    },
    server: {
      uptime: process.uptime() + ' seconds',
      memory: {
        heapUsed: process.memoryUsage().heapUsed,
        heapTotal: process.memoryUsage().heapTotal,
        external: process.memoryUsage().external
      }
    }
  });
});

module.exports = router; 