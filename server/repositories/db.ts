import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

let prismaInstance: PrismaClient | null = null;
let isDbConnected = false;

export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error']
    });
  }
  return prismaInstance;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  if (process.env.USE_MOCK_DATA === 'true') {
    isDbConnected = false;
    return false;
  }
  try {
    const client = getPrismaClient();
    await client.$connect();
    isDbConnected = true;
    logger.info('Connected to PostgreSQL via Prisma successfully');
    return true;
  } catch (error) {
    isDbConnected = false;
    logger.warn('PostgreSQL not accessible, using built-in mock/memory repository fallback');
    return false;
  }
}

export function isDatabaseActive(): boolean {
  return isDbConnected;
}
