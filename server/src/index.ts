import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();

app.use(cors());
app.use(express.json());

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Helper to safely extract a string from a header (which can be string | string[])
function getHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

// Simulated Authentication Middleware
const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const userId = getHeader(req.headers['x-user-id']);
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized. Provide x-user-id header.' });
    return;
  }
  req.userId = userId;
  next();
};

// Routes
// 1. Get all work items
app.get('/api/work-items', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const items = await prisma.workItem.findMany({
      include: { assignedTo: true },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Failed to fetch work items' });
  }
});

// 2. Get a single work item with history
app.get('/api/work-items/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  try {
    const item = await prisma.workItem.findUnique({
      where: { id },
      include: {
        assignedTo: true,
        events: {
          include: { user: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    if (!item) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(item);
  } catch {
    res.status(500).json({ error: 'Failed to fetch work item' });
  }
});

// 3. Create a work item
app.post('/api/work-items', authenticate, async (req: Request, res: Response): Promise<void> => {
  const title = String(req.body.title ?? '');
  const description = String(req.body.description ?? '');
  const priority = String(req.body.priority ?? 'NORMAL');

  try {
    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.workItem.create({
        data: { title, description, priority, status: 'OPEN' }
      });

      await tx.workItemEvent.create({
        data: {
          workItemId: item.id,
          userId: req.userId as string,
          type: 'CREATED',
          payload: JSON.stringify({ title, description, priority })
        }
      });

      return item;
    });
    res.status(201).json(newItem);
  } catch {
    res.status(500).json({ error: 'Failed to create work item' });
  }
});

// 4. Update a work item (with OCC and history)
app.put('/api/work-items/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const { title, description, status, priority, assignedToId } = req.body as {
    title?: string;
    description?: string;
    status?: string;
    priority?: string;
    assignedToId?: string | null;
    version?: number;
  };
  const version: number | undefined = req.body.version as number | undefined;

  if (version === undefined) {
    res.status(400).json({ error: 'Version is required for updates' });
    return;
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const currentItem = await tx.workItem.findUnique({ where: { id } });
      if (!currentItem) throw new Error('NOT_FOUND');
      if (currentItem.version !== version) throw new Error('CONFLICT');

      const updatedItem = await tx.workItem.update({
        where: { id },
        data: { title, description, status, priority, assignedToId, version: { increment: 1 } },
        include: { assignedTo: true }
      });

      const changes: Record<string, unknown> = {};
      if (currentItem.title !== updatedItem.title) changes.title = { from: currentItem.title, to: updatedItem.title };
      if (currentItem.description !== updatedItem.description) changes.description = { from: currentItem.description, to: updatedItem.description };
      if (currentItem.status !== updatedItem.status) changes.status = { from: currentItem.status, to: updatedItem.status };
      if (currentItem.priority !== updatedItem.priority) changes.priority = { from: currentItem.priority, to: updatedItem.priority };
      if (currentItem.assignedToId !== updatedItem.assignedToId) changes.assignedToId = { from: currentItem.assignedToId, to: updatedItem.assignedToId };

      if (Object.keys(changes).length > 0) {
        await tx.workItemEvent.create({
          data: {
            workItemId: id,
            userId: req.userId as string,
            type: 'UPDATED',
            payload: JSON.stringify(changes)
          }
        });
      }

      return updatedItem;
    });

    res.json(result);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message === 'NOT_FOUND') { res.status(404).json({ error: 'Not found' }); return; }
      if (error.message === 'CONFLICT') { res.status(409).json({ error: 'Conflict: The item has been modified by someone else.' }); return; }
    }
    res.status(500).json({ error: 'Failed to update work item' });
  }
});

// 5. Add a comment (event)
app.post('/api/work-items/:id/comments', authenticate, async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id);
  const comment = String(req.body.comment ?? '');

  if (!comment) {
    res.status(400).json({ error: 'Comment is required' });
    return;
  }

  try {
    const event = await prisma.workItemEvent.create({
      data: {
        workItemId: id,
        userId: req.userId as string,
        type: 'COMMENTED',
        payload: JSON.stringify({ comment })
      },
      include: { user: true }
    });
    res.status(201).json(event);
  } catch {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// 6. Get all users — no auth required so the UI can bootstrap itself
app.get('/api/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({ include: { team: true } });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Seed initial data if the DB is empty
app.post('/api/seed', async (_req: Request, res: Response): Promise<void> => {
  const userCount = await prisma.user.count();
  if (userCount === 0) {
    const team1 = await prisma.team.create({ data: { name: 'Engineering' } });
    const team2 = await prisma.team.create({ data: { name: 'Support' } });

    await prisma.user.createMany({
      data: [
        { name: 'Alice Smith', email: 'alice@example.com', teamId: team1.id },
        { name: 'Bob Jones', email: 'bob@example.com', teamId: team1.id },
        { name: 'Charlie Davis', email: 'charlie@example.com', teamId: team2.id },
      ]
    });
    res.json({ message: 'Seeded initial data' });
  } else {
    res.json({ message: 'Already seeded' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
