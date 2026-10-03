import { expect, test, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: 'file:./test.db'
});

beforeAll(async () => {
  // Push schema to test DB
  const { execSync } = require('child_process');
  execSync('npx prisma db push --schema=./prisma/schema.prisma', {
    env: { ...process.env, DATABASE_URL: 'file:./test.db' }
  });
});

afterAll(async () => {
  // Clean up
  await prisma.workItemEvent.deleteMany();
  await prisma.workItem.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();
  await prisma.$disconnect();
});

test('Optimistic Concurrency Control prevents overwrites', async () => {
  // 1. Setup a user and work item
  const user = await prisma.user.create({
    data: { name: 'Test User', email: 'test@example.com' }
  });

  const item = await prisma.workItem.create({
    data: {
      title: 'Initial Title',
      description: 'Initial Description',
      status: 'OPEN',
      priority: 'NORMAL'
    }
  });

  // 2. Simulate User A fetching the item
  const userAFetch = await prisma.workItem.findUnique({ where: { id: item.id } });
  
  // 3. Simulate User B fetching the item
  const userBFetch = await prisma.workItem.findUnique({ where: { id: item.id } });

  // 4. User A successfully updates the item
  const updateA = await prisma.workItem.update({
    where: { 
      id: item.id,
      version: userAFetch!.version // In application code this logic is handled in a transaction, let's replicate the logic here.
    },
    data: {
      title: 'Updated by User A',
      version: { increment: 1 }
    }
  });

  expect(updateA.version).toBe(2);
  expect(updateA.title).toBe('Updated by User A');

  // 5. User B attempts to update the item with the stale version
  // This simulates the transaction throwing an error
  const attemptUpdateB = async () => {
    const currentItem = await prisma.workItem.findUnique({ where: { id: item.id } });
    if (currentItem!.version !== userBFetch!.version) {
      throw new Error('CONFLICT');
    }
    
    return await prisma.workItem.update({
      where: { id: item.id },
      data: {
        title: 'Updated by User B',
        version: { increment: 1 }
      }
    });
  };

  await expect(attemptUpdateB()).rejects.toThrow('CONFLICT');
  
  // Verify final state
  const finalItem = await prisma.workItem.findUnique({ where: { id: item.id } });
  expect(finalItem!.title).toBe('Updated by User A');
  expect(finalItem!.version).toBe(2);
});
