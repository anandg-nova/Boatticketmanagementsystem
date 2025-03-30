const app = require('./app');
const { logger } = require('./utils/logger');

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  logger.info(`Server is running on port ${port}`);
});

// Handle server shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated!');
  });
}); 