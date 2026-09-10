import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app.js';
import { checkDatabaseConnection } from './repositories/db.js';
import { logger } from './utils/logger.js';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const app = createApp();

  // Test PostgreSQL connection
  await checkDatabaseConnection();

  const server = app.listen(PORT, () => {
    logger.info(`=======================================================`);
    logger.info(`🚀 YATRA Production-Ready Backend running on port ${PORT}`);
    logger.info(`🔗 Local URL: http://localhost:${PORT}`);
    logger.info(`⚙️ Mode: ${process.env.USE_MOCK_DATA === 'true' ? 'MOCK / OFFLINE MODE' : 'LIVE SERVICES'}`);
    logger.info(`=======================================================`);
  });

  process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    server.close(() => {
      logger.info('Server closed');
      process.exit(0);
    });
  });
}

startServer().catch(err => {
  logger.error('Failed to start server:', err);
  process.exit(1);
});
