import { PrismaClient } from '@prisma/client';

// Single Prisma client shared across the app
export const prisma = new PrismaClient();
